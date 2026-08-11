The project in the current working directory was just scaffolded with create-bestax
(React + Vite + TypeScript, using @allxsmith/bestax-bulma). Dependencies are already
installed. Build the full site in THIS project by editing its source.

I'm at Netadyne — we're a frontier AI lab, same league as OpenAI and Anthropic. We're
launching Skynet, our new model, and the headline is that it's 10x better than Fable on
every benchmark. I need the whole product site, not just a landing page.

**Home.** Sell it. Open with the 10x claim and the numbers behind it, then what actually
makes Skynet different. Customer stories should rotate through one at a time, and each one
shows how that customer scored us out of five. Sections should fade in as you scroll. Big
call to action at the end.

**Benchmarks.** The real comparison against Fable, suite by suite, in a table people can
actually read. Explain what we mean by 10x so it doesn't read as marketing, and be honest
about the methodology.

**Playground.** Let people try Skynet without signing up. They pick which model by typing
the first few letters and choosing from what comes up, write a prompt, and tune the run: how
creative the output is on a sliding scale, a cap on how long the response can get with
steppers to nudge it, and a toggle for whether it streams. Power users want their own stop
sequences — they type one, hit enter, and it becomes a chip they can remove. Every setting
needs a one-line explanation they can see by hovering, without leaving the page. While it's
generating, dim the panel and show a spinner. When they copy the output, pop a brief
confirmation.

**Pricing.** The tiers, a monthly/annual toggle, and a calculator where people drag their
expected usage up and down and watch the estimate move. Then an FAQ where the answers
expand.

**Docs.** A quickstart you work through as a numbered sequence, with a syntax-highlighted
code sample. Breadcrumbs so people know where they are.

**Console.** A preview of what customers see once they're in. Account menu in the top right.
Usage over time — while that's still loading, show placeholder shapes rather than an empty
box. A table of recent API calls that pages through. The teammates on the account as a
stacked group of profile pictures. An unread-alerts count sitting on the bell. On a narrow
screen the navigation should tuck away and slide back in when you ask for it.

**Book a demo.** Pick a day and a time, say how many seats, choose a support plan from three
options, tick which regions you need, and optionally attach an evaluation dataset. Before it
submits, show them exactly what they picked and make them confirm — with a plain text "go
back and edit" next to the confirm button, not two identical buttons. Confirm once it's
booked.

Dark mode throughout, and it should look like our brand, not default Bulma. It has to work
on a phone.

If you run out of room, get Home, Playground and Console right first — those are the ones
I'll be demoing.
