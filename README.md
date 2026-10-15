# Pickleball Court Booking

A web app for booking pickleball courts. Players book and pay from any phone or computer. Staff manage
everything from a dashboard. It looks and feels like an iPhone app, and it works on any screen size.

## What it does

**For players** (the public booking site)
- Pick a **date**, then a **court**. The booking covers that day's session, from the opening to the
  closing time set in Settings (weekdays, Monday to Thursday, and weekends, Friday to Sunday, have their own hours);
  there are no time slots to choose. Bookings don't lock a court: other players can book the same court and date
  (only courts blocked by the club and closed dates can't be booked).
- In their details they enter **Booked hours**: from 1 hour up to the length of that day's session, in half hours.
  The price updates as they choose: **amount due = number of players × booked hours × rate per hour**.
- Online bookings are for the number of players per court set in Settings (4 to 6 unless you change it).
- Today can be booked until closing time.
- Pay by **bank transfer** (they're shown the club's bank details and a booking reference) or **at the venue**.
- After paying by transfer, send the transfer reference so staff can match the payment.
- **My Bookings**: find a booking by reference and email, add it to their calendar, or cancel it (within the club's cancellation window).
- Club info page with hours, prices, policies, contact details and light/dark appearance.
- Can be added to the iPhone or Android home screen like an app.

**For staff** (`/#/admin`, password protected)
- **Dashboard**: today's bookings, court use, money collected this month, payments to check, a 14-day revenue/bookings
  chart, a live "courts today" timeline, payments to verify, and upcoming bookings.
- **Schedule**: day by day, one card per court with its bookings. Add phone bookings or block a court for the day
  (maintenance, clinics), and search every booking by name, email, phone or reference.
- **Walk-in** (staff only): book customers who arrive at the desk by picking a date and a court, with the same details
  as online booking (including booked hours) and the PLUS reserve option. Walk-ins aren't limited by the online player rules. Staff can pick any date, past
  or future (the players' booking window doesn't apply), including a court that is already booked (bookings share
  courts). Blocked courts and closed dates stay unavailable. Signed-in staff can also book any date from today onwards
  on the Book a Court page. Staff can record "Paid now" with a receipt number. Walk-ins are labelled in lists and can be
  filtered in reports.
- **Holidays and closures** (Settings): close or reopen the club on New Zealand public holidays (this year and next,
  including Mondayised days and Matariki) or on special dates you add, such as your regional anniversary day. Closed
  dates can't be booked by anyone and are shown as closed on every booking page and on Club Info.
- **Booking actions**: confirm, mark paid or unpaid, check in, no-show, cancel, restore, refund, move or edit (including
  booked hours), with a history of changes.
- **PLUS reserve** (staff only): a switch when booking or blocking time, including on the public booking page while a staff
  member is signed in. A PLUS reserve is charged players × booked hours × the PLUS reserve rate instead of the regular rate. Players never see the switch, the rate or the label.
- **Reports**: unfiltered ("All records") or filtered by period (today, this week, this month, last month, custom range and more),
  court, status, payment status, payment method, PLUS reserve, channel (online, walk-in, staff) and text search. Shows totals,
  booked hours, court use, value booked and collected, outstanding money, a by-day/by-month chart, breakdowns by court, status, payment,
  rate, channel and day of week,
  plus the full booking list with booked hours. **Export to CSV** (opens in Excel or Google Sheets) or **print**.
- **Settings**:
  - **Number of courts**: minimum 1, maximum 3, with a name for each court.
  - **Bank accounts**: save one or more accounts and choose which one players pay into. Unpaid bookings switch to the new account straight away.
  - **Opening hours**: separate opening and closing times for weekdays (Monday to Thursday) and weekends (Friday to
    Sunday). Each date's session follows its day.
  - **Booking rules**: minimum players per court for online bookings (1, 2, 3 or 4), maximum (5 or 6), how far ahead
    people can book, cancellation cutoff, automatic release of unpaid bookings.
  - Rate per player per hour, PLUS reserve rate (staff only), currency, time zone.
  - Payment options (bank transfer and/or pay at venue) and payment instructions.
  - Change password, download a backup, sign out.

Bookings never lock a court, so any number can be made for the same court and date. The server still checks every
booking against blocked time and closed dates, and a court can only be blocked while it has no bookings.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd pickleball-booking
npm start
```

Open http://localhost:3000. Go to http://localhost:3000/#/admin the first time to set up your club (name, courts, weekday and
weekend hours, price and a staff password). Prices are in New Zealand dollars (NZD) unless you pick another currency. Then open **Settings → Bank account for payments** to add the account players pay into.

Other devices on the same Wi-Fi can use it at `http://<your computer's IP address>:3000`.
That only works while your computer is on, so for real use put it online as described next.

## Put it online for everyone

To make it reachable by anyone with internet access, run it on a hosting service. Every option below gives you a public
`https://` address you can share with players. You'll need to create an account with the host yourself.

### Option A: Render + Neon (free)

Render's free plan runs the app; Neon's free plan stores the bookings (Render's free plan has no permanent disk).

1. Put this folder in a GitHub repository (GitHub Desktop is the easiest way: **File → Add local repository**, then **Publish**).
2. Create a free database at https://neon.tech. Copy its **connection string** (it starts with `postgresql://`).
3. At https://render.com choose **New → Blueprint**, pick your repository and confirm. When asked, paste the connection string
   into **DATABASE_URL**. You can leave **ADMIN_PASSWORD** empty and set the password on the setup screen instead.
4. When the deploy finishes, open `https://<your-app>.onrender.com/#/admin` and set up your club straight away.
5. Share `https://<your-app>.onrender.com` with your players.

On Render's free plan the app sleeps after 15 minutes without visitors, so the first visit after that takes up to a minute.
Render's paid plans keep it awake.

### Option B: Any host that runs Docker or Node.js

Railway, Fly.io, DigitalOcean, a VPS and similar hosts all work.

- Start command: `node server.js` (or use the included `Dockerfile`).
- Keep bookings by either setting `DATABASE_URL` to a PostgreSQL database, or mounting a persistent disk/volume at
  `/app/data` (Docker) or setting `DATA_DIR` to a folder on a persistent disk.

```bash
docker build -t pickleball-booking .
docker run -d -p 3000:3000 -v pickleball-data:/app/data --name pickleball pickleball-booking
```

Most hosts let you add your own domain name (for example `book.yourclub.com`) and provide HTTPS automatically.

## Settings you can pass to the server

| Variable | What it does |
| --- | --- |
| `PORT` | Port to listen on. Default `3000`. Hosts usually set this for you. |
| `DATABASE_URL` | PostgreSQL connection string. When set, data is stored there instead of a file. |
| `DATABASE_SSL` | Set to `false` if your database does not use SSL. |
| `DATA_DIR` | Folder for `db.json` when no database is set. Default `./data`. |
| `ADMIN_PASSWORD` | Sets the first staff password, so the setup screen isn't needed. |
| `RESET_ADMIN_PASSWORD` | Replaces a forgotten staff password on the next start. Remove it after signing in. |
| `TZ_DEFAULT` | Time zone for a brand-new install, for example `Asia/Manila`. You can change it later in Settings. |

## Backups

**Settings → Download Backup** saves every setting and booking as a JSON file. With the file storage option, you can also
copy `data/db.json` while the app is stopped.

## Security notes

- Staff pages need the staff password. Passwords are stored as salted scrypt hashes, never as plain text.
- Sign-in sessions are signed, HTTP-only cookies. Changing the password signs out every other device.
- Sign-in attempts and online bookings are rate-limited per visitor.
- Players can only see their own booking, and only with both the reference and the email used to book.
  The public availability grid never shows names.
- Always use the `https://` address your host gives you, so passwords and personal details are encrypted in transit.

## Project layout

```
server.js            HTTP server, API routes, static files
lib/bookings.js      Booking rules: settings, pricing, availability, double-booking checks, actions
lib/reports.js       Dashboard figures, filtered reports, CSV export
lib/store.js         Storage: JSON file or PostgreSQL
lib/util.js          Dates, validation, passwords
public/              The app (index.html, app.js, styles.css, icons)
scripts/make-icons.js  Regenerates the home-screen icons
```
