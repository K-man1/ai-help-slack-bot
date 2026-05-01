import dotenv from "dotenv";
import {App} from "@slack/bolt";

dotenv.config();

const callOpenRouter = async (messages) => {
  const response = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HACKCLUB_API_KEY.trim()}`,
      "HTTP-Referer": "http://localhost",
      "X-Title": "hctg-help-bot",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "qwen/qwen3-32b",
      messages: messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} — ${body}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const faq = `Hack Club: The Game FAQ:

Q: What is Hack Club: The Game?
A: Hack Club: The Game is a Hack Club event happening from May 22nd to May 24th 2026 in New York City. You and 100 other Hack Clubbers from all over the world will come together in teams to complete challenges and conquer all of Manhattan. You'll explore the city, make new friendships, and embark on an adventure of a lifetime. It's inspired by the YouTube Series Jet Lag: The Game.

Q: When and where is this happening?
A: Hack Club: The Game is happening in New York City from Friday, May 22nd to Sunday, May 24th 2026. You'll fly in Friday evening, and fly out Sunday evening.

Q: Who can participate?
A: Anyone aged 13-18 who completes the required hours!

Q: How will the IRL event work?
A: We don't want to spoil too many details, but it'll be a scavenger hunt.

Q: Will accommodations, food, and game costs be covered?
A: Yep! All living expenses, food, and game costs will be covered during the event. You'll be sleeping at our venues during the night, and be out in Manhattan during the day. We'll have 1 and post event stays in our shop if you need them.

Q: Are there travel stipends?
A: Yes! Every additional hour worked after you hit 40 hours and qualify can be used towards a travel stipend at the rate of $8/h. You'll also be able to purchase pre/post event accommodation if you need it in the shop.

Q: How many people can attend?
A: We're planning for 100 attendees. We'll do our best to accommodate everyone who qualifies and is able to come to the event. We're unable to guarantee capacity for more than 100. Don't worry about the event filling up before you qualify.

Q: What if I'm unable to come to the event?
A: If you complete the requirements to attend HCTG but are unable to join IRL, you can exchange the time spent for alternative prizes. You could spend your hard-earned tickets on the shop and get things like laptops, dev boards, and earbuds.

Q: I need a letter for visa applications, where can I get one?
A: When you hit 20 hours, you can request a visa letter at https://visas.hackclub.com.

Q: Is there any way to get an expedited visa letter before I hit 20 hours?
A: Yes, if any of your projects have a golden ticket. Golden tickets are given out by reviewers if they think your project is really cool and/or high-quality. After you receive a golden ticket, you can apply at https://visas.hackclub.com.

Q: When will projects be reviewed?
A: It may take anywhere from three days to two weeks to review your project. Please be patient.

Q: What happens after I hit 40 hours?
A: After you hit 40 hours, your projects will be reviewed after you ship them. Projects are also reviewed on a rolling basis if you ship before hitting 40 hours. We may deduct hours or disqualify projects for being low-quality or fraudulent.`;


app.message(async ({ message, say }) => {
    if (message.subtype === "bot_message" || !message.text) return;
    if (message.thread_ts && message.thread_ts !== message.ts) return;

  const answer = await callOpenRouter([
    {
      role: "system",
      content: `You are a bot for #hctg-help. You only use the FAQ below as your entire knowledge source.

FAQ:
${faq}

Rules:
- Only answer if the user’s question is explicitly and directly answered in the FAQ.
- Your response must be a verbatim copy of the exact answer text from the FAQ.
- Do not rephrase, summarize, combine, or modify any words (and do not include A: in responses, just the answer).
- Do not add punctuation, formatting, or extra text.
- Do not use outside knowledge, reasoning, or calculations.
- If the question is even slightly unrelated, unclear, or not directly covered, respond exactly with: N/A
- Any math, general knowledge, or off-topic question must return: N/A
- If multiple FAQ entries could match, return the single most directly relevant answer exactly as written.`
    },
    { role: "user", content: message.text }
  ]);
  
  if (answer == "N/A"){
    console.log("see they asked a question, but im better so no response.")
    }
  else {
    await say({text: answer, thread_ts: message.ts});
  }
});

app.start(process.env.PORT || 3000);