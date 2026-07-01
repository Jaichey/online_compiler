const WANDBOX_COMPILE_URL = "https://wandbox.org/api/compile.json";

function toRequestBody(body) {
    if (typeof body === "string") {
        return body;
    }

    if (body && typeof body === "object") {
        return JSON.stringify(body);
    }

    return "{}";
}

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const upstreamResponse = await fetch(WANDBOX_COMPILE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: toRequestBody(req.body)
        });

        const responseText = await upstreamResponse.text();

        res.status(upstreamResponse.status);
        res.setHeader(
            "Content-Type",
            upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8"
        );
        res.send(responseText);
    } catch (error) {
        res.status(502).json({
            error: "Failed to reach the execution backend",
            message: error instanceof Error ? error.message : String(error)
        });
    }
};