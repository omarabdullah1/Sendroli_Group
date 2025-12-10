# 🌐 Domain & SSL Setup Guide

This guide will help you turn your IP address (`72.62.38.191`) into a secure, professional domain (like `sendroli.com`) with a green lock icon (HTTPS).

## Step 1: Get a Domain Name

If you don't have one yet, you need to buy a domain.
*   **Providers:** Namecheap, GoDaddy, Google Domains, Cloudflare, etc.
*   **Cost:** Usually $10-$15 per year.

## Step 2: Point Domain to Your Server (DNS)

1.  Log in to your domain registrar's dashboard.
2.  Find **DNS Management** or **Name Server Settings**.
3.  Add an **A Record**:
    *   **Type:** `A`
    *   **Host/Name:** `@` (this means the root domain, e.g., `sendroli.com`)
    *   **Value/Target:** `72.62.38.191`
    *   **TTL:** Automatic or 1 hour
4.  (Optional) Add a **CNAME Record** for www:
    *   **Type:** `CNAME`
    *   **Host/Name:** `www`
    *   **Value/Target:** `@` (or `sendroli.com`)

> ⏳ **Wait:** DNS changes can take anywhere from a few minutes to 24 hours to propagate.

## Step 3: Verify DNS Propagation

Before running the SSL script, make sure the domain actually points to your server.

**Run this on your local computer or server:**
```bash
ping yourdomain.com
```
It should show `72.62.38.191`. If it shows an old IP or nothing, wait longer.

## Step 4: Install SSL Certificate (HTTPS)

Once the domain is pointing to your IP, run the automated setup script on your server.

1.  **SSH into your server:**
    ```bash
    ssh root@72.62.38.191
    ```

2.  **Go to the project folder:**
    ```bash
    cd /opt/Sendroli_Group
    ```

3.  **Run the SSL setup script:**
    ```bash
    ./setup-ssl-certificate.sh
    ```

4.  **Follow the prompts:**
    *   Enter your domain name when asked (e.g., `sendroli.com`).
    *   The script will handle the rest (installing Certbot, validating domain, configuring Nginx).

## Step 5: Verify HTTPS

1.  Open your browser.
2.  Go to `https://yourdomain.com`.
3.  You should see the **lock icon** 🔒 next to the URL.
4.  The "Not Secure" warning should be gone.

## 🔄 Automatic Renewal

The script has already set up a "cron job" (scheduled task) to automatically renew your certificate every 90 days. You don't need to do anything manually.

---

## 🆘 Troubleshooting

**"Connection Refused" on HTTPS:**
*   Check if port 443 is open on your firewall.
    ```bash
    ufw allow 443/tcp
    ufw allow 80/tcp
    ```

**"Challenge Failed" during setup:**
*   This usually means DNS hasn't propagated yet. Wait 1 hour and try again.
*   Ensure no other firewall (like AWS Security Groups or DigitalOcean Firewalls) is blocking port 80.

**"Not Secure" still showing:**
*   Clear your browser cache.
*   Try Incognito/Private mode.
