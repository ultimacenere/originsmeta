package com.originsmeta.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * L'app carica originsmeta.com (server.url di capacitor.config.json). Qui le parti native di base:
 * - tasto Indietro: torna alla pagina prima; sulla prima pagina manda l'app in secondo piano, come le altre app;
 * - link a originsmeta.com aperti da fuori (App Links, filtro in AndroidManifest.xml): la pagina si apre nell'app.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView web = bridge == null ? null : bridge.getWebView();
                if (web != null && web.canGoBack()) {
                    web.goBack();
                } else {
                    moveTaskToBack(true);
                }
            }
        });
        openSiteLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        openSiteLink(intent);
    }

    private void openSiteLink(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || bridge == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        String url = SiteLinks.siteUrl(data.getScheme(), data.getHost(), data.getPath(), data.toString());
        if (url != null) bridge.getWebView().loadUrl(url);
    }
}
