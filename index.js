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
// let sitemap = "";
let sitemap = "";
let searchMap = "";
const fastify = (0, fastify_1.default)();
const main = async () => {
    try {
        console.log("app started");
        await mongoose_1.default.connect(process.env.DB ||
            "mongodb+srv://hamidreza:Hamidreza1010@cluster0.up2xok8.mongodb.net/?retryWrites=true&w=majority");
        console.log("Database is connected");
        let all = await thread_1.default.find();
        for await (let a of all) {
            sitemap += `https://forum.yarnovin.ir/t/${a._id}\n`;
        }
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
        sitemap += `https://forum.yarnovin.ir/t/${t._id}\n`;
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
    fastify.post("/search", async (req, res) => {
        // @ts-ignore
        let s = req.body.s;
        let r = await thread_1.default.aggregate([
            {
                $search: {
                    "compound": {
                        "should": [{
                                "text": {
                                    "query": s,
                                    "path": ["description", "title"]
                                },
                            }],
                    }
                }
            }
        ]).limit(3).sort({ title: 1 });
        searchMap += `https://forum.yarnovin.ir/search/${encodeURI(s)}\n`;
        return res.send(r);
    });
    done();
}, { prefix: process.env.AURL || "/UC87TRW" });
fastify.register(require('fastify-favicon'), { path: './public/img/', name: 'favicon.ico', maxAge: 3600 });
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
        id: t?.from,
    };
    let answers = [];
    for (let a of t?.answers) {
        answers.push({
            description: a.description,
            from: await user_1.default.findById(a.from),
            timestamp: a.timestamp,
            id: a.from,
        });
    }
    let other = await thread_1.default
        .find({
        timestamp: {
            $lt: t?.timestamp,
        },
    })
        .sort({ timestamp: -1 })
        .limit(10);
    return res.view("/view/answer.ejs", { q, answers, other });
});
fastify.get("/sitemap/1", (req, res) => {
    res.send(sitemap);
});
fastify.get("/sitemap/2", (req, res) => {
    res.send(searchMap);
});
fastify.get("/user/:id", async (req, res) => {
    // @ts-ignore
    let id = req.params.id;
    let u;
    if (mongoose_1.default.Types.ObjectId.isValid(id)) {
        u = await user_1.default.findById(id);
    }
    else {
        u = await user_1.default.findOne({ username: { $regex: new RegExp(id), $options: 'i' } });
    }
    // @ts-ignore
    if (!u) {
        res.status(404).send("404 error");
    }
    // @ts-ignore
    let sendUser = { name: u?.name, username: u?.username || u._id, bio: u?.bio };
    if (u?.username) {
        sendUser.telegram = true;
    }
    // @ts-ignore
    sendUser.answer = await thread_1.default.countDocuments({ "answers.from": u._id });
    // @ts-ignore
    sendUser.question = await thread_1.default.countDocuments({ from: u._id });
    return res.view("/view/user.ejs", { user: sendUser });
});
fastify.get("/file/:file", async (req, res) => {
    // @ts-ignore
    let data = await storage.getObject({ Bucket: "yarnovin", Key: req.params.file }).promise();
    return res.header("Content-Type", "text/plain").send(data.Body);
});
fastify.get("/", async (req, res) => {
    let q = await thread_1.default
        .find({
        timestamp: {
            $lt: Date.now(),
        },
    })
        .sort({ timestamp: -1 })
        .limit(10);
    let question = [];
    for (let a of q) {
        question.push({
            // @ts-ignore
            id: a._id,
            // @ts-ignore
            title: a.title,
            // @ts-ignore
            text: a.description,
            // @ts-ignore
            name: (await user_1.default.findById(a.from))?.name,
            userid: a.from,
        });
    }
    return res.view("/view/index.ejs", { question });
});
fastify.get("/search/:text", async (req, res) => {
    // @ts-ignore
    let s = req.params.text;
    let r = await thread_1.default.aggregate([
        {
            $search: {
                "compound": {
                    "should": [{
                            "text": {
                                "query": s,
                                "path": ["description", "title"]
                            },
                        }],
                }
            }
        }
    ]).limit(5).sort({ title: 1 });
    let answers = [];
    for (let a of r) {
        let from = await user_1.default.findById(a.from);
        let id;
        if (from?.username) {
            id = from?.username;
        }
        else {
            id = from?._id.toString();
        }
        answers.push({
            _id: a._id.toString(),
            title: a.title,
            description: a.description,
            name: from?.name,
            id,
        });
    }
    return res.view("view/search.ejs", { search: s, answers });
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
