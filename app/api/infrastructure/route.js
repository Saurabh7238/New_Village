import { NextResponse } from 'next/server';
import Infrastructure from '@/models/Infrastructure'; 
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';

// Handler for POST (Create) and PUT (Update) requests
export async function POST(request) {
    await connectDB();

    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    
    try {
        const data = await request.json();
        const { 
            id, // only present for PUT requests
            title, description, type, status, location, cost, 
            installationDate, image, details // 'details' is the object with specific data
        } = data;

        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid infrastructure ID format." }, { status: 400 });
        }

        // Common payload structure
        const payload = {
            title, description, type, status, location, cost, 
            installationDate, image, details
        };

        let savedItem;

        if (id) {
            // PUT: Update existing item
            savedItem = await Infrastructure.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
            if (!savedItem) {
                return NextResponse.json({ message: "Infrastructure item not found." }, { status: 404 });
            }
        } else {
            // POST: Create new item
            const newItem = new Infrastructure(payload);
            savedItem = await newItem.save();
        }

        return NextResponse.json(savedItem, { status: id ? 200 : 201 });

    } catch (error) {
        console.error("API POST/PUT Error:", error);
        return NextResponse.json({ message: "Failed to process infrastructure item." }, { status: 500 });
    }
}

// Handler for GET (Read all) requests
export async function GET() {
    await connectDB();
    try {
        const infrastructureList = await Infrastructure.find({}).sort({ createdAt: -1 });
        return NextResponse.json(infrastructureList, { status: 200 });
    } catch (error) {
        console.error("API GET Error:", error);
        return NextResponse.json({ message: "Failed to fetch infrastructure list." }, { status: 500 });
    }
}

// Handler for DELETE requests
export async function DELETE(request) {
    await connectDB();

    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const data = await request.json().catch(() => ({}));
        const { id } = data;
        
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "A valid ID is required for deletion." }, { status: 400 });
        }

        const deletedItem = await Infrastructure.findByIdAndDelete(id);

        if (!deletedItem) {
            return NextResponse.json({ message: "Infrastructure item not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Infrastructure item deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("API DELETE Error:", error);
        return NextResponse.json({ message: "Failed to delete infrastructure item." }, { status: 500 });
    }
}