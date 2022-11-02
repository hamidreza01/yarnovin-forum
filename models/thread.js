"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const t = new mongoose_1.Schema({
    from: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    topic: { type: [mongoose_1.Schema.Types.String], required: true },
    title: { type: mongoose_1.Schema.Types.String, required: true },
    description: { type: mongoose_1.Schema.Types.String, required: true },
    answers: {
        type: [
            {
                from: mongoose_1.Schema.Types.ObjectId,
                description: mongoose_1.Schema.Types.String,
                timestamp: { type: mongoose_1.Schema.Types.Number, default: () => Date.now() },
            },
        ],
        required: false,
    },
    timestamp: { type: mongoose_1.Schema.Types.Number, default: () => Date.now() },
});
exports.default = (0, mongoose_1.model)("thread", t, "thread");
