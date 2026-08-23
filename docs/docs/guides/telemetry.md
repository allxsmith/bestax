---
title: Telemetry
sidebar_label: Telemetry
sidebar_position: 11
---

# Telemetry

Two bestax CLIs — `create-bestax` and `bestax-migrate` — can send a single
anonymous usage event per run, and only if you say yes first. Telemetry is
**opt-in**, the event contains nothing that could identify you, and it goes to
a first-party endpoint on the maintainer's own infrastructure — no third-party
analytics service is involved. This page is the complete disclosure: everything
that is sent, everything that never is, and every way to control it.

## What we collect

Each CLI sends at most one event, only after a **successful** run, and only if
you opted in.

### create-bestax

Sent once after a successful scaffold:

| Field              | Values                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `template`         | `vite` or `vite-ts`                                                               |
| `bulmaFlavor`      | `complete`, `prefixed`, `no-helpers`, `no-helpers-prefixed`, or `no-dark-mode`    |
| `iconLibrary`      | `none`, `fontawesome`, `mdi`, `ionicons`, `material-icons`, or `material-symbols` |
| `skills`           | `true` or `false` — whether the bestax AI skills were installed                   |
| `packageManager`   | `npm`, `pnpm`, `yarn`, or `bun`                                                   |
| CLI version        | the `create-bestax` version that ran                                              |
| Node major version | e.g. `22`                                                                         |
| OS platform        | the platform name, e.g. `darwin`, `linux`, `win32`                                |

### bestax-migrate

Sent once after a successful run:

| Field              | Values                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `source`           | the source library migrated from, e.g. `react-bulma-components`                                |
| `cssMode`          | `bestax`, `bulma`, or `keep`                                                                   |
| `dry`              | `true` or `false` — whether it was a dry run                                                   |
| `deps`             | `true` or `false` — whether `package.json` dependencies were updated                           |
| Changed-file count | capped at 10,000 (the ingest endpoint buckets it as `0`/`1-9`/`10-49`/`50-199`/`200+`)         |
| TODO counts        | per migration rule: the rule name (including `prop:<jsxProp>` slugs) and a count, nothing else |
| CLI version        | the `bestax-migrate` version that ran                                                          |
| Node major version | e.g. `22`                                                                                      |
| OS platform        | the platform name, e.g. `darwin`, `linux`, `win32`                                             |

Never file paths, never file contents, never code. The TODO report printed in
your terminal lists files and lines; the telemetry event carries only rule
names and counts.

## What we never collect

By design, an event can never include:

- names, emails, or any account information
- IP addresses — the endpoint does not read them and does not store them
- user agents (not stored)
- machine identifiers of any kind
- **random IDs of any kind** — no install ID, session ID, or device ID
- file paths, project names, or file contents
- environment variables

Because no identifier of any kind exists, there is no way to correlate two
events to the same user — even we cannot tell whether two events came from the
same machine.

## How consent works

Telemetry is off until you opt in, and once you answer you're never asked
again (cancelling the question with Ctrl-C is not an answer — you may be asked
on a later run):

- `create-bestax` asks at the end of a successful scaffold.
- `bestax-migrate` asks once after a run, and only on an interactive terminal.

Your answer — yes or no — is stored in `~/.config/bestax/telemetry.json` (or
`$XDG_CONFIG_HOME/bestax/telemetry.json` if you set `XDG_CONFIG_HOME`). Both
CLIs share this file, so answering either one answers for both and you're only
ever asked once. Delete that file to be asked again.

### Overrides

| Control                                     | Effect                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `--telemetry` / `--no-telemetry`            | Flags on both CLIs — set the choice for this run **and persist it** to the consent file |
| `BESTAX_TELEMETRY=1` / `BESTAX_TELEMETRY=0` | Enable or disable for this run only — never persisted                                   |
| `DO_NOT_TRACK=1`                            | Disables telemetry and the consent prompt itself                                        |

One interaction worth spelling out: with `DO_NOT_TRACK` set, an explicit
`--telemetry` flag still applies **to that single run** (typing the flag is a
direct ask, which the DNT convention lets win) — but under `DO_NOT_TRACK` the
flag is **never saved**, so a copied command containing `--telemetry` cannot
enable telemetry beyond the run it was typed for.

## Where the data goes

Events go to `https://bestax.io/api/t`, a first-party Cloudflare Worker running
on the maintainer's own Cloudflare account. It writes into Workers Analytics
Engine as aggregate counts, retained for roughly 90 days. No third-party
analytics service ever sees the data.

As a server-side privacy backstop, the endpoint validates every field of every
event and rejects anything else. With one exception, every field is a closed
enum, a version string, or a bounded integer, so a modified or buggy client
cannot get extra data stored in those fields. The exception is migration rule
names, which are open-ended by design (the `prop:<jsxProp>` slugs mean no fixed
list exists): the endpoint bounds them — at most 20 per event, each 1–64
characters of `A-Za-z0-9._:-` — but stores them verbatim, so a modified client
could record short arbitrary strings there. Aggregate queries treat
unrecognized rule names as noise.

## The MCP server

`bestax-mcp` sends **no telemetry at all** and makes no network requests — it
stays fully offline. Some of the links it prints carry a
`utm_source=bestax-mcp` query parameter: the Docs and Storybook links on
component responses and the link in the version-drift notice are tagged at
render time. Skill bodies and reference docs (`get_skill`, the MCP prompts and
resources) are served verbatim from the bundled markdown — rewriting URLs
inside arbitrary markdown and code examples risks corrupting them — so the
bestax.io links in those are untagged. If you visit the docs site through a
tagged link, that visit is attributable in the site's own traffic analytics.
That is the only measurement, and it happens on bestax.io like any other page
visit.

## Why we collect this

The answers decide where maintenance effort goes: which templates, icon
libraries, Bulma flavors, and migration rules are worth investing in. If
telemetry isn't for you, opting out costs nothing — and the issue tracker is
always the higher-bandwidth channel:
[github.com/allxsmith/bestax/issues](https://github.com/allxsmith/bestax/issues).
