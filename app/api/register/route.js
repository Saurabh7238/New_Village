// api/register/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; 
import User from "@/models/User.js";
import bcrypt from "bcryptjs";

export const POST = async (request) => {
    
    // 1. Initial Validation and Parsing (Wrapped in try/catch)
    let email, password;
    try {
        const body = await request.json();
        email = body.email;
        password = body.password;

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required." }, 
                { status: 400 } // Bad Request
            );
        }
    } catch (error) {
        // Catches errors if the request body is not valid JSON
        return NextResponse.json(
            { message: "Invalid request body." }, 
            { status: 400 }
        );
    }
    
    // 2. Database Connection and Operation (Wrapped in try/catch for errors like 'bad auth')
    try {
        await dbConnect();

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email is already in use." }, 
                { status: 409 } // Conflict
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user instance and save
        const newUser = new User({
            email,
            password: hashedPassword,
            // role: 'user' (optional: include default role if your schema has one)
        });

        await newUser.save();
        
        // Success Response
        return NextResponse.json(
            { message: "User registered successfully." }, 
            { status: 201 } // Created
        );
        
    } catch (error) {
        // Catches database, hashing, or saving errors (including the 'bad auth' from earlier)
        console.error("User Registration Error:", error);
        
        // Ensure the error response is always valid JSON
        return NextResponse.json(
            { message: "Failed to register user due to a server error." }, 
            { status: 500 } // Internal Server Error
        );
    }
};