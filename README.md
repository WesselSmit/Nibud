# Geldstapelen

## De opdracht
Het Budgethandboek is een belangrijk hulpmiddel die het NIBUD biedt met als doel om meer grip te krijgen op je geld. Dit boek is momenteel een fysiek product en wordt door budgetcoaches gebruikt in gesprekken met cliënten. Het doel is om door middel van een digitale tool de begrotingen en informatie uit het fysieke Budgethandboek te presenteren. Denk hierbij goed na over hoe het gebruikt kan worden door budgetcoaches en hoe je het zelf fijn zou vinden om inzicht te krijgen in je inkomsten en uitgaven.

### Over de opdrachtgever, het NIBUD
Al sinds 1979 onderzoekt het Nibud hoe mensen met geld omgaan en ondersteunt hen daarbij. Het voorkomen van geldproblemen is ons doel. Wij doen, verzamelen en combineren onderzoek naar financieel gedrag en bestedingspatronen en vertalen deze naar bruikbare adviezen en toepassingen. Wij zorgen voor een onafhankelijke blik op hoe mensen met geld omgaan en laten zien wat financieel gezien mogelijk is.

[Bron](https://www.nibud.nl/consumenten/het-nibud/organisatie)


## Concept
De budgettool 'Geldstapelen' geeft inzicht in jouw uitgaven op basis van je situatie. Je wordt vergeleken met het huishouden dat het meest met jou overeenkomt en je uitgaven worden verdeeld in tien categorieën. Op basis van deze tien categorieën worden je uitgaven vergeleken en krijg je inzicht in de posten waarin je heel veel uitgeeft, rond het gemiddelde zit of juist heel weinig aan uitgeeft. Dit wordt allemaal visueel weergegeven aan de hand van een datavisualisatie.

<img width="600" src="https://user-images.githubusercontent.com/45405413/72725777-f167f580-3b86-11ea-880b-97f0b175e4d4.png">

> De gebruiker brengt zijn situatie in kaart en het word visueel weergegeven dmv een sims plaatje.

<img width="600" src="https://user-images.githubusercontent.com/45405413/72725776-f167f580-3b86-11ea-98cc-7691dcb50b11.png">

> De gebruiker brengt zijn uitgaven in kaart, vervolgens worden de uitgaven visueel weergegeven in een grouped bar chart.

## Features

### Sims
De tool begint met het invullen van je eigen situatie, dit is belangrijk omdat op basis van deze gegevens er een huishouden wordt geselecteert waar je mee vergeleken wordt. Dit hebben we interessanter gemaakt door dit visueel te maken. Wanneer de gebruiker zijn gezinssamenstelling, woning en auto invult zijn deze terug te zien in de tool. Deze blijven door de hele tool zichtbaar voor een persoonlijk gevoel.

### Formulier

**Accessibility**

Het formulier bevat bijna 100 inputs, dit is heel veel voor de gebruiker om in te vullen. We hebben daarom bij het formulier gedacht aan dit makkelijker te maken voor de gebruiker. De gebruiker kan namelijk met `Tab` gemakkelijk navigeren door de inputvelden.

**Verification**

Om ervoor te zorgen dat tool goed functioneert hebben we input verification toegevoegd. Deze voorkomt aparte inputs zoals:
* Alfabetische karakters (input[type="number"])
* Wiskundige karakters (, . + -)
* Te grote en te kleine waardes (min en max values)

Wanneer de gebruiker toch iets invult wat fout is, krijgt hij een melding die verteld wat de gebruiker fout doet. Ook word de input rood zodat de gebruiker weet bij welke vraag er iets niet klopt. 

**Progress indicators**

Omdat het formulier lang is willen we de gebruiker inzicht geven in zijn progressie. Dit doen we door een progressiebalk aan de bovenkant van elk formulier. Omdat we gebruik maken van progressive disclosure in het formulier en hierdoor dus niet alle inputs altijd zichtbaar zijn gebruiken we ook progress indicators voor de categorieën. Hierdoor hoeft de gebruiker niet alle velden open te klappen om te zien waar de fout zit. 

Wanneer de gebruiker een vraag beantwoord en de verification acht het als verkeerd word de progress indicator ook rood. Op deze manier kan de gebruiker in een oog opslag zien bij welke vraag de fout zit. Dit voorkomt dat de gebruiker alle progressive-disclosure categorieën moet openklappen om de fout te vinden.

### Geldstapel
Wanneer de gebruiker zijn inkomen invult wordt dit opgeslagen en wordt dit bedrag weergegeven in de Geldstapel. Dit is het geld wat de gebruiker door de tool inzicht geeft in het verschil tussen zijn inkomsten en uitgaven. Elke keer dat de gebruiker een uitgavepost invult verdwijnt dat geld van de geldstapel.

### Barchart
Hier worden de uitgaven van de gebruiker vergeleken met zijn vergelijkbaar huishouden. Wanneer de gebruiker een categorie volledig heeft ingevult worden er twee bars gerendert, een van jouw uitgave en een van hoeveel het vergelijkbaar huishouden uitgeeft. Afhankelijk van het verschil krijgt jouw bar een bepaalde kleur. Wanneer jouw uitgaven 15% hoger zijn wordt deze oranje, wanneer deze 15% lager zijn wordt deze groen. Elke waarde daartussen is geel. De bars worden gesorteerd op verschil, op deze manier krijg je de grootste verschillen bovenaan en kun je meteen zien op welke posten je het meest kunt besparen.

### Persoonlijke tips
Voor de drie posten met het grootste verschil wordt er voor elke post een tip gegeven waarmee de gebruiker mogelijk kan bezuinigen. Deze tips komen van het NIBUD zelf, ook wordt er nog advies gegeven om eventueel met een budgetcoach contact op te nemen.

## Inhoudsopgave
* [Install notes](#Install-notes)
* [Data manipulatie](#Data-manipulatie)
* [Nice-to-haves](#Nice-to-haves)
* [Credits](#Credits)

## Install notes
Clone de repository van Github

`https://github.com/WesselSmit/Nibud.git`

Run de applicatie met een code editor live preview of host de source code met service zoals github-pages.

## Dependecy
Deze applicatie maakt gebruik van de D3 library.

## Data manipulatie
De data die wij gebruiken is aangeleverd door NIBUD. Deze data is in de vorm van een Excel document. De data bevat verschillende huishoudtypes en hun uitgaven.

### Opschonen van de data
We laden de data in als CSV en maken hier een array met objecten van.
De data bevat alle informatie voor huishoudens. Deze data hebben we zelf gegroepeerd om alle verschillende huishoudtypes op te halen. De huishoudens die leven van een minimum inkomen (uitkering) zijn gecategoriseerd met de getallen 1 en 2. Dit betekend dat hun inkomsten evenveel is als hun uitgaven. Dit hebben wij aangepast in deze objecten.

### Matchen van vergelijkbaar-huishoud objecten
Om het best vergelijkbare huishouden te vinden kijken we naar meerdere factoren:
1. We kijken naar het huishoudtype (gezinssamenstelling) van de gebruiker en vergelijken deze met de data. Vervolgens filteren we alle niet overeenkomende huishoudens eruit.
> Dit filtert ~90% van de data uit de dataset
2. Vervolgens kijken we naar het inkomen. We pakken het meest dichstbijzijnde inkomen.
> Dit filtert nog ~9% van de data uit de dataset.
3. Omdat de mogelijkheid bestaat dat er meerdere huishoudens overblijven is de laatste variable waar we naar kijken: **Woonkosten** (huur/hypotheek). Hier wordt het huishouden met de meest vergelijkbare woonkosten gekozen, en is dit dus de match.

### Transformeren van de data
Het Budgethandboek hanteert 18 categorieën vooe alle uitgaven. Een aantal categorieën bestonden maar uit een of enkele posten die gemakkelijk onder te brengen waren in een van de andere categorieën. Omdat we een andere structuur hadden aangenomen moest de data ook getransformeerd worden.

Hiervoor hebben we een leeg object aangemaakt waarin we de posten op dezelfde manier gestructureerd hebben. Dit hebben we gedaan voor het de data die de gebruiker invult en de data uit de dataset. Op deze manier wordt de data ingeladen in d3.

<details><summary>D3 Datastructuur</summary>

```javascript
{
    post: "woning",
    bedragen: [{
            data: "persoonlijk",
            bedrag: 358
        },
        {
            data: "gemiddeld",
            bedrag: 233
        }
    ]
    difference: 125
}
 ```

</details>

## Nice-to-haves 
Als we meer tijd hadden zouden we de volgende features nog door willen voeren:

### Viewport Indicator
Een kleine indicator die aangeeft in welke viewport je zit, dit past goed bij de rest van de applicatie omdat we in formulieren ook constant aangeven waar je je bevind/hoe ver je bent in het formulier (progressbar & category-progress-indicators).

### Barchart Breedte Categorieën 
In de barchart hebben we 3 categorieën; deze categorieën worden gebruikt om de kleuren van de barcharts te bepalen. Als we meer tijd hadden willen we ook graag de breedtes laten afhangen van de categorie om net iets meer onderscheid tussen de verschillende categorieën te creëeren.

### Sims Animatie
Bij "uw situatie" word er aan de hand van de gebruikers input een plaatje weergegeven (sims), de sims komen tevoorschijn & verdwijnen met een animatie. De animatie is momenteel alleen te zien wanneer de gebruiker voor het eerst de vraag beantwoord. Als we meer tijd zouden hebben zouden we ook een animatie willen toevoegen voor wanneer de gebruiker van een bestaande input naar een andere input verandert.

## Credits
Tijdens dit project hebben we meerdere bronnen gebruikt als voorbeeld/inspiratie/code:

### [CSV to JS Object](https://gist.github.com/iwek/7154578)
Deze bron hebben we gebruikt om de csv data file van Nibud om te zetten naar een JS object. 

### [Select Tag Stylen](https://stackoverflow.com/questions/38870246/html-css-change-color-of-select-arrow)
Deze bron hebben we gebruikt om te kijken wat een goede aanpak is voor het stylen van een select HTML tag.

### [Digit Regex](https://stackoverflow.com/questions/5917082/regular-expression-to-match-numbers-with-or-without-commas-and-decimals-in-text)
Deze bron hebben we gebruikt om een regex te krijgen die alleen de digits matched.

### [CSS Arrow :before/:after](http://www.cssarrowplease.com/)
Deze bron hebben we gebruikt om te kijken hoe je arrow kan maken dmv pseudo-elementen en borders.

### [CSS Pop Animation](http://bouncejs.com/#{l:1,s:[{T:%22c%22,e:%22B%22,d:5000,D:0,f:{x:1,y:1},t:{x:4,y:4},s:3,b:4}]})
Deze bron hebben we gebruikt om de 'sims' pop animatie te maken, op deze website kan je met een interface CSS animaties maken.

### [CSS Transparent Styling](https://codepen.io/CameronFitzwilliam/pen/pamobO)
Deze bron hebben we gebruikt om text transparant te maken voor een animatie.

### [D3 Grouped Barchart Example](https://blockbuilder.org/bricedev/0d95074b6d83a77dc3ad)
Deze code hebben we gebruikt als example code, dit betekent dat we dit voorbeeld hebben omgebouwd naar onze eigen barchart met onze eigen functionaliteiten en styling.

### [D3 Sorting](https://stackoverflow.com/questions/46205118/how-to-sort-a-d3-bar-chart-based-on-an-array-of-objects-by-value-or-key)
Deze bron hebben we gebruikt om te kijken hoe je een barchart sorteert. 

### [D3 Label Wrapping](https://stackoverflow.com/questions/38487512/wrapping-long-text-labels-in-d3-without-extra-new-lines)
Deze bron hebben we gebruikt om de te lange labels op een nieuwe regel te forceren.

### [First Character Uppercase](https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript)
Deze bron hebben we gebruikt om de D3 labels Uppercase te kunnen maken.

