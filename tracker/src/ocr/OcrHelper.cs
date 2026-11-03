// OCR di Windows per OriginsMeta Tracker (03/11/2026; chi lo chiama: src/main/ocr.ts).
//
// Fino alla 0.5.0 l'app chiamava l'OCR di Windows da PowerShell con "-ExecutionPolicy Bypass -EncodedCommand", la
// riga di comando dei programmi malevoli: Norton la bloccava ("IDP.HELU.PSE96 - Command Line Detection") e diceva
// che l'app era infetta. Questo programma fa la stessa cosa senza PowerShell: legge un PNG dallo standard input (il
// ritaglio della schermata VS, al massimo 512 KB), lo passa a Windows.Media.Ocr con le lingue del profilo di Windows
// (TryCreateFromUserProfileLanguages, come prima) e scrive le righe lette sullo standard output in UTF-8. Niente
// file, niente rete.
//
// Lo compila build.mjs con il csc.exe di .NET Framework 4, che c'è in ogni Windows 10 e 11, contro i metadati di
// System32\WinMetadata: niente System.Runtime.WindowsRuntime (AsTask e simili vogliono il Windows.winmd dell'SDK),
// quindi le operazioni asincrone si aspettano qui (`Wait`).
//
// Uscita: 0 letto (anche zero righe), 2 ingresso non valido, 3 nessuna lingua OCR installata, 1 altri errori.
using System;
using System.IO;
using System.Reflection;
using System.Text;
using System.Threading;
using Windows.Foundation;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;
using Windows.Storage.Streams;

[assembly: AssemblyTitle("OriginsMeta Tracker OCR")]
[assembly: AssemblyDescription("OriginsMeta Tracker OCR")]
[assembly: AssemblyCompany("OriginsMeta")]
[assembly: AssemblyProduct("OriginsMeta Tracker")]
[assembly: AssemblyCopyright("OriginsMeta, non affiliato a Koin Games")]

static class OcrHelper
{
    const int MaxPng = 512 * 1024;
    const int TimeoutMs = 15000;

    [MTAThread]
    static int Main()
    {
        try
        {
            byte[] png = ReadPng();
            if (png == null) return 2;
            OcrEngine engine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (engine == null) return 3;
            using (InMemoryRandomAccessStream stream = new InMemoryRandomAccessStream())
            {
                using (DataWriter writer = new DataWriter(stream))
                {
                    writer.WriteBytes(png);
                    Wait(writer.StoreAsync());
                    writer.DetachStream();
                }
                stream.Seek(0);
                BitmapDecoder decoder = Wait(BitmapDecoder.CreateAsync(stream));
                using (SoftwareBitmap bitmap = Wait(decoder.GetSoftwareBitmapAsync()))
                {
                    OcrResult result = Wait(engine.RecognizeAsync(bitmap));
                    StringBuilder text = new StringBuilder();
                    foreach (OcrLine line in result.Lines) text.Append(line.Text).Append('\n');
                    byte[] bytes = new UTF8Encoding(false).GetBytes(text.ToString());
                    using (Stream output = Console.OpenStandardOutput()) output.Write(bytes, 0, bytes.Length);
                }
            }
            return 0;
        }
        catch (Exception)
        {
            return 1;
        }
    }

    /// Il risultato di un'operazione di Windows, aspettato qui (al massimo `TimeoutMs`).
    static T Wait<T>(IAsyncOperation<T> op)
    {
        DateTime end = DateTime.UtcNow.AddMilliseconds(TimeoutMs);
        while (op.Status == AsyncStatus.Started)
        {
            if (DateTime.UtcNow > end) throw new TimeoutException();
            Thread.Sleep(2);
        }
        if (op.Status != AsyncStatus.Completed) throw new InvalidOperationException("operazione non riuscita");
        return op.GetResults();
    }

    /// Il PNG dallo standard input, o null se è troppo grande o non è un PNG.
    static byte[] ReadPng()
    {
        using (Stream input = Console.OpenStandardInput())
        using (MemoryStream data = new MemoryStream())
        {
            byte[] chunk = new byte[16384];
            int n;
            while ((n = input.Read(chunk, 0, chunk.Length)) > 0)
            {
                if (data.Length + n > MaxPng) return null;
                data.Write(chunk, 0, n);
            }
            byte[] png = data.ToArray();
            return png.Length > 8 && png[0] == 0x89 && png[1] == 0x50 && png[2] == 0x4E && png[3] == 0x47 ? png : null;
        }
    }
}
