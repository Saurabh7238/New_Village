import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';  // Your MongoDB connection file
import VoterData from '@/models/VoterData'; // The new Mongoose Model
import mongoose from 'mongoose'; 

// List of valid types for validation
const VALID_TYPES = ['vidhan-sabha', 'lok-sabha', 'gram-panchayat'];

// --- GET: Fetch data from MongoDB ---
export async function GET(request) {
    // 1. Connect to the database
    await dbConnect(); 

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'vidhan-sabha';

        if (!VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid voter type' }, { status: 400 });
        }

        // 2. Query MongoDB, filtered by the document type
        const data = await VoterData.find({ type: type }).exec();
        
        return NextResponse.json(data);

    } catch (error) {
        console.error('Failed to fetch voter data from MongoDB:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// --- POST: Add new item to MongoDB ---
export async function POST(request) {
    // 1. Connect to the database
    await dbConnect(); 

    try {
        const body = await request.json();
        const { type, ...newItem } = body;
        
        if (!VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid voter type' }, { status: 400 });
        }

        // 2. Create the new record in MongoDB
        const newRecord = await VoterData.create({
            type: type, // Assign the type discriminator
            ...newItem // Spread the rest of the submitted fields
        });
        
        return NextResponse.json(newRecord);

    } catch (error) {
        console.error('Failed to add voter item to MongoDB:', error);
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }
}

// --- DELETE: Remove item from MongoDB ---
export async function DELETE(request) {
    // 1. Connect to the database
    await dbConnect(); 

    try {
        const body = await request.json();
        const { id, type } = body; 
        
        if (!id || !type) {
             return NextResponse.json({ error: 'ID and type are required for deletion' }, { status: 400 });
        }

        if (!VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid voter type' }, { status: 400 });
        }

        // Mongoose uses _id, so we assume the client is sending the MongoDB _id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        // 2. Delete the record from MongoDB by its unique _id and the type
        const result = await VoterData.deleteOne({ _id: id, type: type });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Item not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Failed to delete voter item from MongoDB:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}