// fastify
import Fastify from "fastify";
import view from "@fastify/view";

// node
import path from "path";

// other
import mongoose from "mongoose";
import aws from 'aws-sdk';

// app
import thread from "./models/thread";
import user from "./models/user";
// let sitemap = "";

const storage = new aws.S3({
    endpoint: "storage.iran.liara.space",
    accessKeyId: "10e9vtf3l3gf",
    secretAccessKey: "5a72be9c-d3ed-4170-9c63-bb2c2e82d878",
    region: "default",
});
let pageKey = "pages.txt";
let searchKey = "search.txt";

const fastify = Fastify();
const main = async () => {
    try {
        console.log("app started")
        await mongoose.connect(
            process.env.DB ||
            "mongodb+srv://hamidreza:Hamidreza1010@cluster0.up2xok8.mongodb.net/?retryWrites=true&w=majority"
        );
        console.log("Database is connected");
        let all = await thread.find();
        let sitemap: any = "";
        for await (let a of all) {
            sitemap += `https://forum.yarnovin.ir/t/${a._id}\n`
        }
        await storage.putObject({ Bucket: "yarnovin", Key: pageKey, Body: sitemap }).promise();

        sitemap = undefined;
    } catch (error) {
        console.error(error);
    }
};


fastify.register(require("@fastify/static"), {
    root: path.join(__dirname + "/public"),
    prefix: "/public/",
});

fastify.register(view, {
    engine: {
        ejs: require("ejs"),
    },
});

fastify.register(
    (fastify, _, done) => {
        fastify.post("/addThread", async (req, res) => {
            const { from, description, title, topic } = req.body as any;
            let u = await user.findOne({ userid: from.userid });
            if (!u) {
                const u2 = new user({
                    name: from.name,
                    userid: from.userid,
                });
                if (from.username) {
                    u2.username = from.username;
                }
                await u2.save();
                u = u2;
            }
            const t = new thread({
                from: u?._id,
                description,
                title,
                topic,
            });
            await t.save();
            let data = await storage.getObject({ Bucket: "yarnovin", Key: pageKey }).promise();
            data.Body += `https://forum.yarnovin.ir/t/${t._id}\n`
            await storage.putObject({ Bucket: "yarnovin", Key: pageKey, Body: data.Body }).promise();
            res.send(t);
        });
        fastify.post("/addAnswer", async (req, res) => {
            const { from, description, threadId } = req.body as any;
            let u = await user.findOne({ userid: from.userid });
            if (!u) {
                const u2 = new user({
                    name: from.name,
                    userid: from.userid,
                });
                if (from.username) {
                    u2.username = from.username;
                }
                await u2.save();
                u = u2;
            }
            await thread.updateOne(
                { _id: threadId },
                {
                    $push: {
                        answers: {
                            from: u?._id,
                            description,
                        },
                    },
                }
            );
        });
        fastify.post("/search", async (req, res) => {
            // @ts-ignore
            let s = req.body.s;
            let r = await thread.aggregate([
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
            ]).limit(5).sort({ title: 1 })
            let data = await storage.getObject({ Bucket: "yarnovin", Key: searchKey }).promise();
            data.Body += `https://forum.yarnovin.ir/search/${encodeURI(s)}\n`
            await storage.putObject({ Bucket: "yarnovin", Key: searchKey, Body: data.Body }).promise();
            return res.send(r);
        })
        fastify.get("/change/page/:name", (req, res) => {
            // @ts-ignore
            pageKey = req.params.name;
            res.send("ok");
        })
        fastify.get("/change/search/:name", (req, res) => {
            // @ts-ignore
            searchKey = req.params.name;
            res.send("ok");
        })
        done();
    }, { prefix: process.env.AURL || "/UC87TRW" }
);

fastify.register(require('fastify-favicon'), { path: './public/img/', name: 'favicon.ico', maxAge: 3600 });


fastify.get("/t/:id", async (req, res) => {
    const { id } = req.params as any;
    const t = await thread.findById(id);
    if (!t) {
        res.status(400).redirect("https://telegram.me/devyargp");
    }
    const q = {
        title: t?.title,
        description: t?.description,
        from: await user.findById(t?.from),
        timestamp: t?.timestamp,
        topic: t?.topic,
        id: t?.from,
    };
    let answers = [];
    for (let a of t?.answers!) {
        answers.push({
            description: a.description,
            from: await user.findById(a.from),
            timestamp: a.timestamp,
            id: a.from,
        });
    }
    let other = await thread
        .find({
            timestamp: {
                $lt: t?.timestamp,
            },
        })
        .sort({ timestamp: -1 })
        .limit(10);
    return res.view("/view/answer.ejs", { q, answers, other });
});

fastify.get("/user/:id", async (req, res) => {
    // @ts-ignore
    let id = req.params.id
    let u;
    if (mongoose.Types.ObjectId.isValid(id)) {
        u = await user.findById(id);
    } else {
        u = await user.findOne({ username: { $regex: new RegExp(id), $options: 'i' } });
    }
    // @ts-ignore
    if (!u) {
        res.status(404).send("404 error")
    }
    // @ts-ignore
    let sendUser = { name: u?.name, username: u?.username || u._id } as any;
    if (u?.username) {
        sendUser.telegram = true;
    }
    // @ts-ignore
    sendUser.answer = await thread.countDocuments({ "answers.from": u._id });
    // @ts-ignore
    sendUser.question = await thread.countDocuments({ from: u._id });
    return res.view("/view/user.ejs", { user: sendUser });
})

fastify.get("/getStringFile/:file", async (req, res) => {
    // @ts-ignore
    let data = await storage.getObject({ Bucket: "yarnovin", Key: req.params.file }).promise();
    return res.header("Content-Type", "text/plain").send(data.Body)
})


fastify.get("/", async (req, res) => {
    let q = await thread
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
            name: (await user.findById(a.from))?.name,
            userid: a.from,
        })
    }
    return res.view("/view/index.ejs", { question })
});

fastify.get("/test", (req, res) => {
    res.view("view/index.ejs");
});

fastify.get("/search", (req, res) => {
    res.redirect("/");
})

fastify.get("/search/:text", async (req, res) => {
    // @ts-ignore
    let s = req.params.text;
    let r = await thread.aggregate([
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
    ]).limit(5).sort({ title: 1 })
    let answers: any = [];
    for (let a of r) {
        let from = await user.findById(a.from);
        let id;
        if (from?.username) {
            id = from?.username;
        } else {
            id = from?._id.toString();
        }
        answers.push({
            title: a.title,
            description: a.description,
            name: from?.name,
            id,
        })
    }
    return res.view("view/search.ejs", { search: s, answers });
})

fastify.setNotFoundHandler((req, res) => {
    res.status(400).redirect("https://telegram.me/devyargp");
});

fastify.setErrorHandler((err, req, res) => {
    console.log(err);
    res.send("oops, error :(");
});

fastify.listen(
    {
        port: Number(process.env.PORT || 3000),
        host: "0.0.0.0",
    },
    async (err, address) => {
        if (!err) {
            await main();
            return console.info(address);
        }
        console.error(err);
    }
);
