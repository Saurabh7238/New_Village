import mongoose, { Schema } from 'mongoose';

// Define the schema for the notification
const NotificationSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Notification text is required.'],
        trim: true,
        maxlength: [200, 'Text cannot exceed 200 characters.']
    },
    href: {
        type: String,
        required: [true, 'Link (href) is required.'],
        trim: true
    }
}, {
    timestamps: true 
});

// Important: Prevents Mongoose from re-compiling the model on hot-reload
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default NotificationModel;