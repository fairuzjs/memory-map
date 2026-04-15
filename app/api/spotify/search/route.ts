import { NextResponse } from "next/server"

// Route ini untuk mencari lagu di Spotify dengan Client Credentials Flow
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const query = searchParams.get("q")

        if (!query || query.trim() === "") {
            return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 })
        }

        const clientId = process.env.SPOTIFY_CLIENT_ID
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

        if (!clientId || !clientSecret) {
            console.error("Spotify credentials not configured. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
            return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 })
        }

        // 1. Get Access Token
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
            }),
            cache: "no-store",
        })

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text()
            let errData: any = errText
            try { errData = JSON.parse(errText) } catch (e) {}
            console.error("Spotify token error:", errData)
            return NextResponse.json(
                { error: "Failed to authenticate with Spotify", detail: errData },
                { status: 502 }
            )
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        if (!accessToken) {
            console.error("Spotify token response missing access_token:", tokenData)
            return NextResponse.json({ error: "Failed to obtain Spotify access token" }, { status: 502 })
        }

        // 2. Search Tracks
        // Catatan: Spotify Development Mode membatasi limit maksimum 5 per request.
        // Untuk menaikkan limit, publish app di Spotify Developer Dashboard.
        const encodedQuery = encodeURIComponent(query.trim())
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`

        const searchResponse = await fetch(searchUrl, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: "no-store",
        })

        if (!searchResponse.ok) {
            const errText = await searchResponse.text()
            let errData: any = errText
            try { errData = JSON.parse(errText) } catch (e) {}
            console.error("Spotify search error:", errData)
            return NextResponse.json(
                { error: "Failed to search Spotify", detail: errData },
                { status: 502 }
            )
        }

        const searchData = await searchResponse.json()

        // Format hasil pencarian untuk frontend
        const tracks = searchData.tracks?.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            artists: item.artists.map((a: any) => a.name).join(", "),
            albumArt: item.album.images[0]?.url || "",
            duration_ms: item.duration_ms,
            preview_url: item.preview_url,
            explicit: item.explicit,
            external_url: item.external_urls.spotify
        })) || []

        return NextResponse.json({ tracks })

    } catch (error: any) {
        console.error("Spotify search API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}