package com.originsmeta.app;

/**
 * Quali link aperti da fuori (App Links) l'app carica al suo interno. Solo pagine di originsmeta.com in https:
 * qualunque altro indirizzo resta al browser. Le sezioni sono quelle del filtro in AndroidManifest.xml; le rotte
 * tecniche (/api, /auth, /overlay, /broadcast) restano fuori anche lì. Funzione pura, provata in SiteLinksTest.
 */
final class SiteLinks {
    private SiteLinks() {}

    static final String SITE = "https://originsmeta.com";

    /** L'indirizzo da caricare nell'app, o null se il link non è una pagina del sito. */
    static String siteUrl(String scheme, String host, String path, String url) {
        if (url == null || !"https".equalsIgnoreCase(scheme) || host == null) return null;
        String h = host.toLowerCase(java.util.Locale.ROOT);
        if (!h.equals("originsmeta.com") && !h.equals("www.originsmeta.com")) return null;
        String p = path == null || path.isEmpty() ? "/" : path;
        if (p.startsWith("/api/") || p.startsWith("/auth/") || p.startsWith("/overlay") || p.startsWith("/broadcast")) {
            return null;
        }
        return url;
    }
}
