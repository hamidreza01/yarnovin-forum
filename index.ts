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

const fastify = Fastify({});

const main = async () => {
  try {
    await mongoose.connect(
      process.env.DB ||
        "mongodb+srv://hamidreza:Hamidreza1010@cluster0.up2xok8.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("Database is connected");
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
    done();
  },
  { prefix: process.env.AURL || "/UC87TRW" }
);

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
  };
  let answers = [];
  for (let a of t?.answers!) {
    answers.push({
      description: a.description,
      from: await user.findById(a.from),
      timestamp: a.timestamp,
    });
  }
  let other = await thread
    .find({
      timestamp : {
        $lt: t?.timestamp,
      },
    })
    .limit(5);
  return res.view("/view/index.ejs", { q, answers, other});
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
