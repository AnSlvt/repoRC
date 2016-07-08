#TweatMap

TweatMap è un servizio web che permette di autenticarsi con il proprio account Twitter e di visualizzare su una mappa la posizione in tempo reale dei tweet geolocalizzati pubblicati dagli utenti di tutto il mondo.
Il servizio include anche delle notifiche asincrone che informano l'utente del numero di tweet ricevuto nella precedente sessione, e delle API REST pubbliche che permettono di interfacciarsi con il sito

##API REST

Il servizio permette di effettuare diverse chiamate REST per ricavare informazioni sulla propria timeline e sui tweet degli utenti

###GET search/tag_geocode

Restituisce un elenco di tweet con l'hashtag specificato, entro un certo raggio dalle coordinate desiderate, indicando la distanza di ogni tweet dal centro delle coordinate scelte

####Resource URL
/search/:tag/:geocode

Caratteristiche | Dettagli
--------- | ---------
<b>Formato risposta</b> | JSON
<b>Richiede autenticazione</b> | Sì

Parameters | Description
--------- | ---------
<b>tag</b> | Hashtag da cercare nei tweet restituiti<br/><b>Esempio: </b> #ciaone
<b>geocode</b> | Posizione e raggio entro cui cercare i tweet<br/><b>Esempio: </b> 37.781157,-122.398720,1000mi

####Esempio di chiamata
<b>GET</b>
http://localhost:3000/search/#ciaone/37.781157,-122.398720,1000mi

####Esempio di risposta
```json
{
  "tweets": [
    {
      "text": "Millennials have purpose in their DNA. Great piece from two college students on their #cannes2016 experience.\nhttps://t.co/bLWPuFsVZo",
      "date": "Wed Jul 06 19:10:21 +0000 2016",
      "distance": 304
    },
    {
      "text": "This is a random tweet! I am so happy!",
      "date": "Wed Jul 06 19:07:21 +0000 2016",
      "distance": 455
    }
  ]
}
```
<b>Nota: </b>la distanza sarà uguale a -1 per i tweet che non sono geolocalizzati, ma si trovano comunque entro il raggio specificato
___

###GET hashcount/:hashtag/:hours/:geocode

Restituisce un elenco di tweet con la parola chiave desiderata, pubblicati entro le ultime ore nell'area indicata

####Resource URL
/hashcount/:hashtag/:hours/:geocode

Caratteristiche | Dettagli
--------- | ---------
<b>Formato risposta</b> | JSON
<b>Richiede autenticazione</b> | Sì

Parameters | Description
--------- | ---------
<b>hashtag</b> | Hashtag o parola chiave da cercare nei tweet restituiti<br/><b>Esempio: </b> brexit
<b>hours</b> | Intervallo di tempo in ore in cui cercare i risultati<br/><b>Esempio: </b> 24
<b>geocode</b> | Posizione e raggio entro cui cercare i tweet<br/><b>Esempio: </b> 37.781157,-122.398720,1000mi

####Esempio di chiamata
<b>GET</b>
http://localhost:3000/hashcount/brexit/24/37.781157,-122.398720,1000mi

####Esempio di risposta
```json
{
  "tweets_count": 15
}
```
___

###GET wordfrequency/:word/:hours/:geocode

Restituisce un elenco di tweet contenenti la parola specificata, entro un certo raggio dalle coordinate desiderate, indicando l'ora di pubblicazione di ogni tweet e il numero totale di tweet restituiti

####Resource URL
/wordfrequency/:word/:hours/:geocode

Caratteristiche | Dettagli
--------- | ---------
<b>Formato risposta</b> | JSON
<b>Richiede autenticazione</b> | Sì

Parametri | Descrizione
--------- | ---------
<b>word</b> | Parola da cercare nei tweet restituiti<br/><b>Esempio: </b> cannes2016
<b>hours</b> | Intervallo di tempo in ore in cui cercare i risultati<br/><b>Esempio: </b> 24
<b>geocode</b> | Posizione e raggio entro cui cercare i tweet<br/><b>Esempio: </b> 37.781157,-122.398720,1000m

####Esempio di chiamata
<b>GET</b>
http://localhost:3000/wordfrequency/cannes2016/24/37.781157,-122.398720,1000mi

####Esempio di risposta
```json
{
  "tweets_count": 2,
  "tweets": [
    {
      "text": "Could I possibly get one of those 3ft Hello Kitty plushes for my apartment and not seem creepy? No? Okay.",
      "author_name": "tori holder",
      "posted_at": "Fri Jul 08 12:44:09 +0000 2016"
    },
    {
      "text": "Guys. Hello 😊",
      "author_name": "D.W.",
      "posted_at": "Fri Jul 08 12:43:57 +0000 2016"
    }
  ]
}
```
___

###GET trendsandplaces/:lat/:long/:radius

Restituisce un elenco di trend in una determinata zona, e di luoghi di interesse nei dintorni

####Resource URL
/trendsandplaces/:lat/:long/:radius

Caratteristiche | Dettagli
--------- | ---------
<b>Formato risposta</b> | JSON
<b>Richiede autenticazione</b> | Sì

Parameters | Description
--------- | ---------
<b>lat</b> | Latitudine di destinazione<br/><b>Esempio: </b> 37.781157
<b>long</b> | Longitudine di destinazione<br/><b>Esempio: </b> -122.398720
<b>radius</b> | Posizione <i>in metri</i> raggio entro cui cercare i tweet<br/><b>Esempio: </b> 1000

####Esempio di chiamata
<b>GET</b>
http://localhost:3000/trendsandplaces/37.781157/-122.398720/1000

####Esempio di risposta
```json
{
  "trends": [
    {
      "name": "#DallasPoliceShooting",
      "tweets_count": 79178
    },
    {
      "name": "#ShawnMendesTODAY",
      "tweets_count": 26301
    },
    {
      "name": "#AwakenSummer",
      "tweets_count": 0
    }
  ],
  "places": [
    {
      "name": "San Francisco",
      "vicinity": "San Francisco"
    },
    {
      "name": "Bay Bridge Inn",
      "vicinity": "966 Harrison Street, San Francisco"
    },
    {
      "name": "Courtyard San Francisco Downtown",
      "vicinity": "299 2nd Street, San Francisco"
    }
  ]
}
```
