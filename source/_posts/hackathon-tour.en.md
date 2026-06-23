---
title: Super Fusion Hackathon Travelogue
img: /images/hackathon-drink.jpg
coverImg: /images/hackathon-drink.jpg
categories:
  - life
tags:
  - blog
lang: en
translation_key: hackathon-tour
date: 2026-05-26 15:00:00
---

## Originally Just Wanted to Score Some Prizes

Back in April, M-chan pulled me into forming a team for the Super Fusion Hackathon. During the preliminary round, I teamed up with Big J. At the time, the prizes on offer were just too generous to pass up, so we joined for fun. In the end, it turned into a competition of packaging Agent products, and I learned quite a bit from it.

In the preliminaries, Big J and I vibed together an OS Agent, and we ended up qualifying for the offline finals. Looking back now, making it to the offline stage probably wasn’t just because we implemented all the features thoroughly—more importantly, it was likely because Big J polished the documentation and presentation to perfection.

## Day 0: Longhu

The final was on May 17th, held at Super Fusion in Zhengzhou, located at Longhu. The day before the competition, we arrived at the hotel to drop off our stuff. My room hadn’t been cleaned yet, and I had to wait until it was ready to get the key card, so I hung out in M-chan’s room for quite a while chatting.

Then we went to the venue to test the environment. The venue was big and comfortable, with warm lighting and ergonomic chairs. On the table was an embedded development board and a Super Fusion workstation. Both sides of the room had floor-to-ceiling windows overlooking Longhu; the scenery was pretty nice.

We arrived a bit late. By the time we got to the competition venue, most of the other teams were already there, configuring their IDEs and environments. We set up the official AI API provided but didn’t try connecting to the official workstation. After hanging around the venue for a while, we went together to Longhu to eat.

I’d been to Longhu once about a year ago, back then accompanying family for shopping and buying clothes. This time I went to eat there with the bros, and ended up having Tendon Ten again. The last time I saw them was during the May Day holiday.

## The Competition

Back at the hotel, classic insomnia struck. My sleep schedule had already been wrecked from school, and I had to get up early in the morning to attend the opening ceremony. During the ceremony, the topics were announced, and sure enough, they were all Agent-related. 48 hours to work on 7 tasks.

One of the tasks was to deploy openclaw on the embedded board. Big J attempted to develop for the embedded system in a Windows environment and basically spent the whole day behind bars.

M-chan single-handedly tackled four tasks—multi-head attention in full effect.

I worked on a reproduction task for autofigure-edit. The gist was: have a large model first generate an image, then convert that image into editable vector code. I couldn’t think of any improvements, so I just tried to orchestrate the process according to the paper’s flow, and that alone took me a good chunk of time.

After reproducing it, I felt the most useful part was the large model itself. Gemini is just too impressive; honestly, relying solely on Gemini to draw the image -> write vector code from the image, the pictures generated in those two steps were already good enough.

There was also a task to rewrite a C-language system monitoring component in Rust. Even though I’ve dabbled a bit in Rust, I let the AI handle all the writing in the background. In the end, there was no time left to tweak it further.

I still felt my condition wasn’t great. Reading the paper cost me some time. During reproduction, I ran into quite a few bugs; AI couldn’t fix them, so I had to fix them myself, which ate up a lot of time. Most of the time was spent on bug-fixing. If there’s a lesson to be learned, it’s that if you want your code to be good, you’ve got to use the best AI. I shouldn’t have tried to save money by using the API provided at the venue for free.

## A Total Loss

The biggest takeaway from the three-day competition was going to the café downstairs every afternoon for a cup of fruit tea, plus the keyboard they gave away as a prize. Although it’s a pity we didn’t win any awards in the end, looking back, our code for several of the tasks was actually pretty decent, and our local benchmark scores weren’t low. During the presentation session of this hackathon, we didn’t have much time to prepare, so our story wasn’t told well.

Had I known there’d be no prize, I’d have gone back to sleep at the hotel on the hackathon nights instead. What a loss.
