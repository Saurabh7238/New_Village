import { NextResponse } from 'next/server';
import Infrastructure from '@/models/Infrastructure'; 
import connectDB from '@/lib/db'; // <-- FIXED: Correct import path

// Handler for POST (Create) and PUT (Update) requests
export async function POST(request) {
    await connectDB();
    
    try {
        const data = await request.json();
        const { 
            id, // only present for PUT requests
            title, description, type, status, location, cost, 
            installationDate, image, details // 'details' is the object with specific data
        } = data;

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
        // Provide helpful error details for debugging the client
        const errorMessage = error.message || "Server Error";
        return NextResponse.json({ message: "Failed to process infrastructure item.", details: errorMessage }, { status: 500 });
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
    try {
        const { id } = await request.json();
        
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
