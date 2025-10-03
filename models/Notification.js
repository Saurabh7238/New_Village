import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Notification title is required."],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Notification description is required."],
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    // Optional field to categorize the notification type (e.g., 'alert', 'info', 'update')
    category: {
        type: String,
        required: false,
        default: 'info',
    }
}, { timestamps: true });

// Check if the model already exists before defining it
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;