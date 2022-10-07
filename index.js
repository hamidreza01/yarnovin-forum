"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// fastify
const fastify_1 = __importDefault(require("fastify"));
const view_1 = __importDefault(require("@fastify/view"));
// node
const path_1 = __importDefault(require("path"));
// other
const mongoose_1 = __importDefault(require("mongoose"));
// app
const thread_1 = __importDefault(require("./models/thread"));
const user_1 = __importDefault(require("./models/user"));
const fastify = (0, fastify_1.default)({});
const main = async () => {
    try {
        await mongoose_1.default.connect(process.env.DB ||
            "mongodb+srv://hamidreza:Hamidreza1010@cluster0.up2xok8.mongodb.net/?retryWrites=true&w=majority");
        console.log("Database is connected");
    }
    catch (error) {
        console.error(error);
    }
};
fastify.register(require("@fastify/static"), {
    root: path_1.default.join(__dirname + "/public"),
    prefix: "/public/",
});
fastify.register(view_1.default, {
    engine: {
        ejs: require("ejs"),
    },
});
fastify.register((fastify, _, done) => {
    fastify.post("/addThread", async (req, res) => {
        const { from, description, title, topic } = req.body;
        let u = await user_1.default.findOne({ userid: from.userid });
        if (!u) {
            const u2 = new user_1.default({
                name: from.name,
                userid: from.userid,
            });
            if (from.username) {
                u2.username = from.username;
            }
            await u2.save();
            u = u2;
        }
        const t = new thread_1.default({
            from: u?._id,
            description,
            title,
            topic,
        });
        await t.save();
        res.send(t);
    });
    fastify.post("/addAnswer", async (req, res) => {
        const { from, description, threadId } = req.body;
        let u = await user_1.default.findOne({ userid: from.userid });
        if (!u) {
            const u2 = new user_1.default({
                name: from.name,
                userid: from.userid,
            });
            if (from.username) {
                u2.username = from.username;
            }
            await u2.save();
            u = u2;
        }
        await thread_1.default.updateOne({ _id: threadId }, {
            $push: {
                answers: {
                    from: u?._id,
                    description,
                },
            },
        });
    });
    done();
}, { prefix: process.env.AURL || "/UC87TRW" });
fastify.get("/t/:id", async (req, res) => {
    const { id } = req.params;
    const t = await thread_1.default.findById(id);
    if (!t) {
        res.status(400).redirect("https://telegram.me/devyargp");
    }
    const q = {
        title: t?.title,
        description: t?.description,
        from: await user_1.default.findById(t?.from),
        timestamp: t?.timestamp,
        topic: t?.topic,
    };
    let answers = [];
    for (let a of t?.answers) {
        answers.push({
            description: a.description,
            from: await user_1.default.findById(a.from),
            timestamp: a.timestamp,
        });
    }
    let other = await thread_1.default
        .find({
        timestamp: {
            $lt: t?.timestamp,
        },
    })
        .limit(5);
    return res.view("/view/index.ejs", { q, answers, other });
});
fastify.get("/", (req, res) => {
    res.redirect("https://telegram.me/devyargp");
});
fastify.get("/test", (req, res) => {
    res.view("view/index.ejs");
});
fastify.setNotFoundHandler((req, res) => {
    res.status(400).redirect("https://telegram.me/devyargp");
});
fastify.setErrorHandler((err, req, res) => {
    console.log(err);
    res.send("oops, error :(");
});
fastify.listen({
    port: Number(process.env.PORT || 3000),
    host: "0.0.0.0",
}, async (err, address) => {
    if (!err) {
        await main();
        return console.info(address);
    }
    console.error(err);
});
