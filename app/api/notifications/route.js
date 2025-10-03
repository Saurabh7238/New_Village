import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification"; 
import mongoose from "mongoose"; // Import mongoose for ID validation

// --- GET (FETCH ALL NOTIFICATIONS) ---
export async function GET() {
    try {
        await dbConnect();
        const notifications = await Notification.find().sort({ createdAt: -1 }); 
        
        // Map _id to id for front-end compatibility
        const responseData = notifications.map(n => ({
            ...n.toObject(), 
            id: n._id.toString() 
        }));
        
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error("GET Notifications Error:", error);
        return NextResponse.json({ message: "Failed to fetch notifications." }, { status: 500 });
    }
}

// --- POST (CREATE NOTIFICATION) ---
export async function POST(request) {
    try {
        await dbConnect();
        const { title, description, category } = await request.json();

        if (!title || !description) {
            return NextResponse.json({ message: "Title and description are required." }, { status: 400 });
        }

        const newNotification = await Notification.create({ title, description, category });
        
        // Map _id to id for front-end compatibility
        const responseData = { ...newNotification.toObject(), id: newNotification._id.toString() }; 

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error("POST Notification (Create) Error:", error);
        return NextResponse.json({ message: "Failed to create notification." }, { status: 500 });
    }
}

// --- PUT (UPDATE/EDIT NOTIFICATION) ---
export async function PUT(request) {
    try {
        await dbConnect();
        // Extract the notification ID from the URL search parameters
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const { title, description, isRead, category } = await request.json();

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Valid notification ID is required for update." }, { status: 400 });
        }
        
        if (!title || !description) {
            return NextResponse.json({ message: "Title and description cannot be empty." }, { status: 400 });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { title, description, isRead, category },
            { new: true } // returns the updated document
        );

        if (!updatedNotification) {
            return NextResponse.json({ message: "Notification not found." }, { status: 404 });
        }

        // Map _id to id for front-end compatibility
        const responseData = { ...updatedNotification.toObject(), id: updatedNotification._id.toString() };

        return NextResponse.json({ message: "Notification updated successfully.", notification: responseData }, { status: 200 });

    } catch (error) {
        console.error("PUT Notification (Update) Error:", error);
        return NextResponse.json({ message: "Failed to update notification.", details: error.message }, { status: 500 });
    }
}

// --- DELETE (DELETE NOTIFICATION) ---
export async function DELETE(request) {
    try {
        await dbConnect();
        // Note: Delete request bodies can be tricky; retrieving ID from URL is often more robust.
        const { id } = await request.json(); 

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Valid notification ID is required for deletion." }, { status: 400 });
        }

        const deletedNotification = await Notification.findByIdAndDelete(id);

        if (!deletedNotification) {
            return NextResponse.json({ message: "Notification not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "Notification deleted successfully." }, { status: 200 });

    } catch (error) {
        console.error("DELETE Notification Error:", error);
        return NextResponse.json({ message: "Failed to delete notification.", details: error.message }, { status: 500 });
    }
}
