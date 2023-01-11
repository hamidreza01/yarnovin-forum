"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const u = new mongoose_1.Schema({
    name: mongoose_1.Schema.Types.String,
    username: { type: mongoose_1.Schema.Types.String, required: false },
    userid: { type: mongoose_1.Schema.Types.String, required: true },
    bio: { type: mongoose_1.Schema.Types.String },
});
exports.default = (0, mongoose_1.model)("user", u, "user");
