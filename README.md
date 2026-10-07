# Plannity

Osobisty planer w formie aplikacji instalowanej na telefonie (PWA). Moduły aplikacji: start (kafelki, pogoda dla Ochoty i Włoch, wschód i zachód słońca), zadania do zrobienia, plan roczny, nawyki, licznik dni, kalendarz, harmonogram dnia, obowiązki domowe, notatki i statystyki.

Dane zapisują się w pamięci telefonu (w przeglądarce, z której aplikacja została zainstalowana). Aplikacja działa offline. Do pogody potrzebny jest internet.

## Instalacja przez GitHub Pages (ok. 5 minut, za darmo)

1. Wejdź na https://github.com i zaloguj się, albo załóż konto.
2. Kliknij **+** w prawym górnym rogu i wybierz **New repository**.
   - Repository name: `plannity`
   - Ustaw **Public**. GitHub Pages za darmo działa tylko dla publicznych repozytoriów, ale Twoje dane i tak nie trafiają do repozytorium, bo zostają w telefonie.
   - Kliknij **Create repository**.
3. Na stronie nowego repozytorium kliknij link **uploading an existing file**.
4. Rozpakuj `plannity.zip` na komputerze. Przeciągnij do okna przeglądarki **całą zawartość** folderu `plannity`: `index.html`, `manifest.json`, `sw.js` oraz foldery `css`, `js`, `icons`. Potem kliknij **Commit changes**.
   - `index.html` musi leżeć na głównym poziomie repozytorium, a nie w podfolderze.
5. Wejdź w **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)**, potem **Save**.
6. Po 1–2 minutach na górze tej strony pojawi się adres, np. `https://TWOJA-NAZWA.github.io/plannity/`.

## Instalacja na telefonie

- **Android (Chrome):** otwórz adres, wybierz menu ⋮ i kliknij **Zainstaluj aplikację** albo **Dodaj do ekranu głównego**.
- **iPhone (Safari):** otwórz adres, kliknij przycisk Udostępnij □↑ i wybierz **Do ekranu początkowego**.

Ikona Plannity pojawi się na ekranie telefonu, a aplikacja otwiera się na pełnym ekranie.

## Aktualizacja aplikacji

Podmień zmienione pliki w repozytorium. Dane w telefonie zostają. Jeżeli nowa wersja nie pojawia się od razu, zamknij aplikację i otwórz ją ponownie.

## Kopia zapasowa

Wejdź w **Menu (≡) → Eksportuj dane** i zapisz plik `.json`. Ten sam plik wczytasz na nowym telefonie przez **Importuj dane**.
