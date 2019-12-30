import data from './modules/loadData.js'
import transform from './modules/transformData.js'

const allInputs = d3.selectAll('#uw_situatie input, #uw_situatie select')._groups[0],
    allQuestionCategories = d3.selectAll('.question_category')._groups[0],
    labels = document.querySelectorAll('form label'),
    tooltip = document.querySelector('#tooltip'),
    digitRegex = /^\d+$/

let tooltipData, //receives toolltip-data (async)
    pressedKey //last fired event.key

data.getData() //fetch dataset-data
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => console.log(transform.createHousehold(csvRows)))
    .catch(err => console.log(err))

data.getTooltips() //fetch tooltip-data
    .then(data => tooltipData = data)
    .then(data => addTooltips())
    .catch(err => console.log(err))


//tooltip
function addTooltips() { //fixes tooltip styling, content & tooltip location 
    Object.entries(tooltipData).forEach(entry => {
        labels.forEach(label => {
            if (label.getAttribute('for') == entry[0]) { //check if label should get a tooltip
                label.dataset.has_tooltip = true

                let tooltipIcon = new Image //add tooltip-icons to DOM
                tooltipIcon.classList.add('tooltip-icon')
                tooltipIcon.src = "./media/tooltip-icon.svg"
                label.append(tooltipIcon)

                label.children[0].addEventListener('mousemove', function () {
                    tooltip.children[0].textContent = entry[1]
                    tooltip.style.display = 'block'
                    tooltip.style.left = event.pageX + 20 + 'px'
                    tooltip.style.top = event.pageY + 'px'

                    if (event.pageY + tooltip.getBoundingClientRect().height > window.innerHeight + window.scrollY) {
                        tooltip.style.top = (event.pageY - tooltip.getBoundingClientRect().height) + 10 + 'px' //make sure the whole tooltip is in viewport
                    }
                })

                tooltipIcon.addEventListener('mouseout', function () { //hide tooltip when user-cursor leaves tooltip-icon
                    tooltip.style.display = 'none'
                })
            }
        })
    })
}

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input =>
    input.addEventListener('input', function () { //call functions on input
        checkIfValueIsAllowed(this) //value validation
        updateProgressbar() //progress-bar
        updateProgressIndicators(this) //progress indicator
        updateTotalIncome(this) //total income
        fixSelectFocus(this) //fix select focus state
    }))
document.querySelectorAll('input, select').forEach(input =>
    input.addEventListener('keydown', function (e) {
        pressedKey = e
    }))


function checkIfValueIsAllowed(currentEl) {
    let minIsValid = false,
        maxIsValid = false

    if (currentEl.type === 'number') { //checking if value is valid according to min & max attribute-values
        if (parseInt(currentEl.value) < parseInt(currentEl.min) === false && digitRegex.test(currentEl.value) === true) {
            minIsValid = true
        }
        if (parseInt(currentEl.value) > parseInt(currentEl.max) === false && digitRegex.test(currentEl.value) === true) {
            maxIsValid = true
        }

        if (maxIsValid && minIsValid && currentEl.value !== "" && currentEl.value.includes(',') === false) {
            currentEl.classList.remove('invalid') //fix & reset styling according to number of invalid answer

            d3.selectAll('.invalid-warning')._groups[0].forEach(warning => {
                if (warning.previousSibling.classList.contains('invalid') === false) {
                    warning.remove() //remove all unnecessary/unvalid warnings
                }
            })

        } else {
            currentEl.classList.add('invalid')

            let invalidTextContent = ""
            if (currentEl.value === "" && pressedKey.key === 'Backspace') { //value is empty
                invalidTextContent = "Antwoord moet ingevuld worden"
            } else if (minIsValid === false) { //value is smaller than min-value
                invalidTextContent = "Antwoord moet groter zijn dan " + currentEl.min
            } else if (maxIsValid === false) { //value is higher than max-value
                invalidTextContent = "Antwoord moet kleiner zijn dan " + currentEl.max
            }
            if (pressedKey.key == ',' || pressedKey.key == '.' || pressedKey.key == '+' || pressedKey.key == '-') { //value contains disallowed chars 
                invalidTextContent = "Antwoord mag geen " + pressedKey.key + " bevatten"
            }

            if (currentEl.nextSibling.tagName != 'SPAN') { //create warning 
                const createWarning = document.createElement('span')
                event.target.parentNode.insertBefore(createWarning, event.target.nextSibling) //insert createWarning as next element on same level in DOM
                createWarning.classList.add('invalid-warning')
                createWarning.textContent = invalidTextContent
                createWarning.style.left = currentEl.getBoundingClientRect().left + -30 + "px"

                if (currentEl === document.querySelector('#kinderen')) { //additional position-styling for #kinderen
                    createWarning.style.width = currentEl.getBoundingClientRect().width + "px"
                }
            } else {
                currentEl.nextSibling.textContent = invalidTextContent //update warning text-content
            }
        }
    }
}

function updateProgressbar() {
    let inputsWithValue = 0,
        numberOfTotalRadio = 0

    allInputs.forEach(input => { //checking all inputs for values & radio inputs
        if (input.tagName === 'SELECT' && input.value != '' ||
            input.type === 'radio' && input.checked === true ||
            input.type !== 'radio' && input.tagName !== 'SELECT' && input.value != '') {
            inputsWithValue++
        }
        if (input.type === 'radio') {
            numberOfTotalRadio++
        }
    })
    let uniqueInputs = allInputs.length - (numberOfTotalRadio / 2),
        progression = document.querySelector('#uw_situatie #progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue
    document.querySelector('#uw_situatie #progression').style.paddingRight = progression + "px" //calculating progress & updating in DOM/styling

    let hasInvalidValue = false
    for (const input of allInputs) {
        if (input.classList.contains('invalid')) { //checking for invalid values
            hasInvalidValue = true
        }
    }
    if (inputsWithValue === uniqueInputs && hasInvalidValue === false) { //hide & fixing styling
        document.querySelector('section:nth-of-type(2) form').classList.remove('hide')
        getFormData()
    } else {
        document.querySelector('section:nth-of-type(2) form').classList.add('hide')
        document.getElementById('progression').classList.add('invalidProgress')
    }
    if (hasInvalidValue === false) {
        document.getElementById('progression').classList.remove('invalidProgress') //reset styling if all invalid values have been corrected
    }
}

//TODO:
// * de onderstaande functie herschrijven zodat die hardcoded is om rekening te houden met de radio-buttons & select etc.
// * dit zou betekenen dat de alle dynamische vragen/inputs in de HTML (hardcoded) gezet kunnen worden en op deze manier hoef je niet te kloten met elementen aanmaken
function updateProgressIndicators(currentEl) {
    // TODO: let op onderstaande notities:
    // ! deze methode houd geen rekening met de verschillende dynamische inputs
    // ! alle mogelijke inputs binnen de huidige fieldset worden opgehaald
    // ! dit betekent dat alle dynamische inputs (alle inputs die afhangen van de antwoorden van de gebruiker) moeten dynamisch gemaakt worden (d3 of JS)
    // ! chech hier de HMTL nog ff op, want op dit moment staan alle mogelijkheden in de HTML -> deze moeten dus dynamisch aangemaakt gaan worden
    // ! als deze dynamisch aangemaakt worden dan werkt deze functie, als je dit niet doet dan moet je deze functie herschrijven
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }

    const allCurrentInputs = currentEl.querySelectorAll('input, select')
    let answeredQuestions = 0,
        numberOfRadio = 0,
        hasInvalidValue = false

    for (const currentInput of allCurrentInputs) {
        if (currentInput.type === 'radio' && currentInput.checked === true || currentInput.type !== 'radio' && currentInput.value != '') { //check for answers
            answeredQuestions++
        }
        if (currentInput.type === 'radio') { //check for radio input
            numberOfRadio++
        }
    }

    if (answeredQuestions === allCurrentInputs.length - (numberOfRadio / 2)) { //style progress-indicator color if all questions are answered
        currentEl.querySelector('div>span:first-of-type').classList.add('hasAnswer')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('hasAnswer')
    }

    for (const currentInput of allCurrentInputs) { //check for invalid values
        if (currentInput.classList.contains('invalid')) {
            hasInvalidValue = true
        }
    }
    if (hasInvalidValue) { //fix styling for invalid values
        currentEl.querySelector('div>span:first-of-type').classList.add('invalidValue')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('invalidValue')
    }
}

//total income
function updateTotalIncome(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }

    if (currentEl.getAttribute('data_question') === '2') { //prevents multi-question sums
        const allCurrentInputs = currentEl.querySelectorAll('input')
        let totalIncome = 0,
            questionsAnswered = 0

        for (const currentInput of allCurrentInputs) { //fix the total income
            if (currentInput.value != '') {
                totalIncome = totalIncome + parseInt(currentInput.value)
                document.getElementById('totaleInkomen').textContent = totalIncome + " euro"
                document.getElementById('totalIncome').classList.remove('hide')
                questionsAnswered++
            }
        }
        if (questionsAnswered === 0) { //hide totalIncome if no question has been answered
            document.getElementById('totalIncome').classList.add('hide')
        }
    }
}

//fix SELECT element focus
function fixSelectFocus(currentEl) {
    if (currentEl.tagName === 'SELECT') {
        currentEl.parentElement.focus() //give focus to select when it's the active element
    }
}

//progressive disclosure
allQuestionCategories.forEach(category => {
    category.addEventListener('click', function () { //give all question-categories an eventListener
        for (const question of allQuestionCategories) { //reset styling for all question-categories & dropdown images
            question.classList.remove('hide')
            question.classList.add('hide')
            question.querySelector('div:first-of-type>img').classList.remove('activeDropdown')
        }
        category.querySelector('div:first-of-type>img').classList.add('activeDropdown')
        this.classList.remove('hide') //show questions of current category

        if (event.target.tagName != 'LABEL' && event.target.tagName != 'INPUT' && event.target.tagName != 'SELECT') {
            this.querySelectorAll('input, select')[0].focus() //when opening a new question-category -> give first input focus
        }
    }, false)
})

//car dynamic-inputs
document.getElementById('car').addEventListener('input', function () {
    document.getElementById('has_a_car').classList.remove('hide') //if user has car -> show additional questions
})

// Function that gets all the data from the input fields when filled in
function getFormData() {
    let personalHousehold = {
        huishoudType: null,
        // ! Woonsituatie: gemiddelde of 1,5 keer gemiddel hypotheek? Wat is dat?
        woonsituatie: null,
        inkomen: null,
        totaleUitgaven: null,
        uitgavenPosten: null
    }
    // huishoudType: "Huishoudtype bepalen",
    // woonsituatie: "Woonsituatie bepalen",
    // inkomen: "Alle inkomsten opgeteld",
    // totaleUitgaven: "Alle waarden uit de array opgeteld",
    // uitgavenPosten: "Array van alle uitgaven"
    let uwSituatie = {}

    document.querySelectorAll('#uw_situatie form input[type="number"], #uw_situatie form input:checked, #uw_situatie form select').forEach(input => {
        if (input.type == "number") {
            uwSituatie[input.id] = parseInt(input.value)
        }
        if (input.type == "radio") {
            uwSituatie[input.name] = input.value
        }
        if (input.type == "select-one") {
            uwSituatie[input.id] = input.value
        }
    })

    if (uwSituatie.partner == "false" && uwSituatie.leeftijd < 67 && uwSituatie.kinderen == 0) {
        personalHousehold.huishoudType = "alleenstaand"
    }
    if (uwSituatie.partner == "false" && uwSituatie.leeftijd >= 67 && uwSituatie.kinderen == 0) {
        personalHousehold.huishoudType = "alleenstaand aow"
    }
    if (uwSituatie.partner == "false" && uwSituatie.kinderen == 1) {
        personalHousehold.huishoudType = "eenouder met 1 kind"
    }
    if (uwSituatie.partner == "false" && uwSituatie.kinderen == 2) {
        personalHousehold.huishoudType = "eenouder met 2 kinderen"
    }
    if (uwSituatie.partner == "false" && uwSituatie.kinderen == 3) {
        personalHousehold.huishoudType = "eenouder met 3 kinderen"
    }
    if (uwSituatie.partner == "true" && uwSituatie.kinderen == 0) {
        personalHousehold.huishoudType = "paar zonder kinderen"
    }
    if (uwSituatie.partner == "true" && uwSituatie.leeftijd >= 67) {
        personalHousehold.huishoudType = "ouder paar"
    }
    if (uwSituatie.partner == "true" && uwSituatie.kinderen == 1) {
        personalHousehold.huishoudType = "paar met 1 kind"
    }
    if (uwSituatie.partner == "true" && uwSituatie.kinderen == 2) {
        personalHousehold.huishoudType = "paar met 2 kinderen"
    }
    if (uwSituatie.partner == "true" && uwSituatie.kinderen == 3) {
        personalHousehold.huishoudType = "paar met 3 kinderen"
    }

    let inkomen
    if (uwSituatie.partner == "false") {
        inkomen = uwSituatie.netto_maandinkomen + uwSituatie.netto_vakantiegeld + uwSituatie.reiskostenvergoeding + uwSituatie.dertiende_maand + uwSituatie.bijverdiensten + uwSituatie.kinderbijslag + uwSituatie.zorgtoeslag + uwSituatie.kindgebonden_budget + uwSituatie.huurtoeslag + uwSituatie.kinderopvangtoeslag + uwSituatie.teruggave_belasting + uwSituatie.alimentatie + uwSituatie.kostgeld_inwonende_personen + uwSituatie.inkomsten_uit_vermogen + uwSituatie.gemeentelijke_ondersteuning + uwSituatie.overige_inkomsten
    }
    if (uwSituatie.partner == "true") {
        inkomen = uwSituatie.netto_maandinkomen + uwSituatie.netto_vakantiegeld + uwSituatie.reiskostenvergoeding + uwSituatie.dertiende_maand + uwSituatie.bijverdiensten + uwSituatie.netto_maandinkomenPartner + uwSituatie.netto_vakantiegeldPartner + uwSituatie.reiskostenvergoedingPartner + uwSituatie.dertiende_maandPartner + uwSituatie.bijverdienstenPartner + uwSituatie.kinderbijslag + uwSituatie.zorgtoeslag + uwSituatie.kindgebonden_budget + uwSituatie.huurtoeslag + uwSituatie.kinderopvangtoeslag + uwSituatie.teruggave_belasting + uwSituatie.alimentatie + uwSituatie.kostgeld_inwonende_personen + uwSituatie.inkomsten_uit_vermogen + uwSituatie.gemeentelijke_ondersteuning + uwSituatie.overige_inkomsten
    }
    personalHousehold.inkomen = inkomen

    console.log(personalHousehold)
}