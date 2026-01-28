import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    query,
    collection,
    where,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Household {
    id: string;
    name: string;
    ownerId: string;
    memberIds: string[];
    inviteCode: string;
    createdAt: Date;
}

export interface HouseholdMember {
    id: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

// Generate a random 6-character invite code
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new household
export async function createHousehold(
    userId: string,
    name: string
): Promise<Household> {
    const householdId = `household_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteCode = generateInviteCode();

    const household: Omit<Household, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
        id: householdId,
        name,
        ownerId: userId,
        memberIds: [userId],
        inviteCode,
        createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'households', householdId), household);

    // Update user's householdId
    await setDoc(doc(db, 'userData', userId), { householdId }, { merge: true });

    return {
        ...household,
        createdAt: new Date(),
    } as Household;
}

// Join a household using invite code
export async function joinHousehold(
    userId: string,
    inviteCode: string
): Promise<Household | null> {
    // Find household with this invite code
    const q = query(
        collection(db, 'households'),
        where('inviteCode', '==', inviteCode.toUpperCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error('Invalid invite code');
    }

    const householdDoc = snapshot.docs[0];
    const household = householdDoc.data() as Household;

    // Check if already a member
    if (household.memberIds.includes(userId)) {
        throw new Error('You are already a member of this household');
    }

    // Add user to household
    await updateDoc(doc(db, 'households', household.id), {
        memberIds: arrayUnion(userId),
    });

    // Update user's householdId
    await setDoc(doc(db, 'userData', userId), { householdId: household.id }, { merge: true });

    return {
        ...household,
        memberIds: [...household.memberIds, userId],
    };
}

// Leave a household
export async function leaveHousehold(userId: string, householdId: string): Promise<void> {
    const householdRef = doc(db, 'households', householdId);
    const householdSnap = await getDoc(householdRef);

    if (!householdSnap.exists()) {
        throw new Error('Household not found');
    }

    const household = householdSnap.data() as Household;

    // If owner is leaving, delete the household (or transfer ownership)
    if (household.ownerId === userId) {
        // For now, just remove self - household stays for other members
        // Could implement ownership transfer later
    }

    // Remove user from household
    await updateDoc(householdRef, {
        memberIds: arrayRemove(userId),
    });

    // Clear user's householdId
    await setDoc(doc(db, 'userData', userId), { householdId: null }, { merge: true });
}

// Get household by ID
export async function getHousehold(householdId: string): Promise<Household | null> {
    const householdSnap = await getDoc(doc(db, 'households', householdId));

    if (!householdSnap.exists()) {
        return null;
    }

    return householdSnap.data() as Household;
}

// Get user's household ID from their userData
export async function getUserHouseholdId(userId: string): Promise<string | null> {
    const userSnap = await getDoc(doc(db, 'userData', userId));

    if (!userSnap.exists()) {
        return null;
    }

    return userSnap.data()?.householdId || null;
}

// Regenerate invite code (for security)
export async function regenerateInviteCode(
    userId: string,
    householdId: string
): Promise<string> {
    const householdSnap = await getDoc(doc(db, 'households', householdId));

    if (!householdSnap.exists()) {
        throw new Error('Household not found');
    }

    const household = householdSnap.data() as Household;

    // Only owner can regenerate code
    if (household.ownerId !== userId) {
        throw new Error('Only the household owner can regenerate the invite code');
    }

    const newCode = generateInviteCode();

    await updateDoc(doc(db, 'households', householdId), {
        inviteCode: newCode,
    });

    return newCode;
}
