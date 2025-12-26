import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // Duration in seconds
        default: 5 // Default 5 seconds for images
    },
    location: {
        type: String,
        default: ''
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    hashtags: [{
        type: String
    }],
    views: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: {
            type: String,
            default: '❤️'
        },
        reactedAt: {
            type: Date,
            default: Date.now
        }
    }],
    replies: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        },
        repliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete after expiration
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isHighlighted: {
        type: Boolean,
        default: false
    },
    highlightAlbum: {
        type: String,
        default: ''
    }
}, { 
    timestamps: true 
});

// Index for efficient querying
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ 'views.userId': 1 });

const Story = mongoose.model('Story', storySchema);

export default Story;