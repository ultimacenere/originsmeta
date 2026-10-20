package com.originsmeta.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

public class SiteLinksTest {

    @Test
    public void paginaDelSitoSiApreNellApp() {
        String url = "https://originsmeta.com/it/decks/community/mazzo-di-prova";
        assertEquals(url, SiteLinks.siteUrl("https", "originsmeta.com", "/it/decks/community/mazzo-di-prova", url));
        String www = "https://www.originsmeta.com/en";
        assertEquals(www, SiteLinks.siteUrl("https", "WWW.OriginsMeta.com", "/en", www));
        assertEquals("https://originsmeta.com", SiteLinks.siteUrl("https", "originsmeta.com", "", "https://originsmeta.com"));
    }

    @Test
    public void altriSitiEHttpRestanoAlBrowser() {
        assertNull(SiteLinks.siteUrl("http", "originsmeta.com", "/it", "http://originsmeta.com/it"));
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com.evil.example", "/it", "https://originsmeta.com.evil.example/it"));
        assertNull(SiteLinks.siteUrl("https", "store.steampowered.com", "/app/4429430", "https://store.steampowered.com/app/4429430"));
        assertNull(SiteLinks.siteUrl("https", null, "/it", "https:///it"));
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com", "/it", null));
    }

    @Test
    public void rotteTecnicheRestanoFuori() {
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com", "/auth/callback", "https://originsmeta.com/auth/callback?code=x"));
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com", "/api/tracker/download", "https://originsmeta.com/api/tracker/download"));
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com", "/overlay/deck/x", "https://originsmeta.com/overlay/deck/x"));
        assertNull(SiteLinks.siteUrl("https", "originsmeta.com", "/broadcast/live", "https://originsmeta.com/broadcast/live"));
    }
}
