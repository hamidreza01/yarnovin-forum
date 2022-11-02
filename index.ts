// fastify
import Fastify from "fastify";
import view from "@fastify/view";

// node
import path from "path";

// other
import mongoose from "mongoose";

// app
import thread from "./models/thread";
import user from "./models/user";
let sitemap = "";
const fastify = Fastify();
const main = async () => {
    try {
        await mongoose.connect(
            process.env.DB ||
            "mongodb+srv://hamidreza:Hamidreza1010@cluster0.up2xok8.mongodb.net/?retryWrites=true&w=majority"
        );
        console.log("Database is connected");
        let all = await thread.find();
        for await (let a of all){
            sitemap += "https://forum.yarnovin.ir/t/"+ a._id + "\n"
        }
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
            const {from, description, title, topic} = req.body as any;
            let u = await user.findOne({userid: from.userid});
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
            sitemap += "https://forum.yarnovin.ir/t/" + t._id + "\n";
            res.send(t);
        });
        fastify.post("/addAnswer", async (req, res) => {
            const {from, description, threadId} = req.body as any;
            let u = await user.findOne({userid: from.userid});
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
                {_id: threadId},
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
            ]).limit(3).sort({title: 1})

            res.send(r);
        })
        done();
    }, {prefix: process.env.AURL || "/UC87TRW"}
);

fastify.register(require('fastify-favicon'), {path: './public/img/', name: 'favicon.ico', maxAge: 3600});

fastify.get("/t/:id", async (req, res) => {
    const {id} = req.params as any;
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
        id : t?.from,
    };
    let answers = [];
    for (let a of t?.answers!) {
        answers.push({
            description: a.description,
            from: await user.findById(a.from),
            timestamp: a.timestamp,
            id : a.from,
        });
    }
    let other = await thread
        .find({
            timestamp: {
                $lt: t?.timestamp,
            },
        })
        .sort({timestamp: -1})
        .limit(8);
    return res.view("/view/answer.ejs", {q, answers, other});
});

fastify.get("/user/:id",async (req,res)=>{
    // @ts-ignore
    let id = req.params.id
    let u;
    if (mongoose.Types.ObjectId.isValid(id)){
        u = await user.findById(id);
    }else{
        u = await user.findOne({username : { $regex : new RegExp(id), $options: 'i'}});
    }
    // @ts-ignore
    if(!u){
        res.status(404).send("404 error")
    }
    // @ts-ignore
    let sendUser = {name : u?.name, username : u?.username || u._id} as any;
    if(u?.username){
        sendUser.telegram = true;
    }
    // @ts-ignore
    sendUser.answer = await thread.countDocuments({"answers.from" : u._id});
    // @ts-ignore
    sendUser.question = await thread.countDocuments({from : u._id});
    return res.view("/view/user.ejs", {user : sendUser});
})

fastify.get("/sitemap/1",(req,res)=>{
    res.send(sitemap);
})

fastify.get("/", async (req, res) => {
    let q = await thread
        .find({
            timestamp: {
                $lt: Date.now(),
            },
        })
        .sort({timestamp: -1})
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
            userid : a.from,
        })
    }
    return res.view("/view/index.ejs", {question})
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
