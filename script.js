import data from './modules/loadData.js'
import transform from './modules/transformData.js'


const allQuestionCategories = d3.selectAll('.question_category')._groups[0],
    labels = document.querySelectorAll('form label'),
    tooltip = document.querySelector('#tooltip'),
    digitRegex = /^\d+$/


let tooltipData, //receives toolltip-data (async)
    pressedKey, //last fired event.key
    secondCar = false,
    a,
    b,
    allDataHouseHolds,
    matchingHouseHold



data.getData() //fetch dataset-data
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => allDataHouseHolds = transform.createHousehold(csvRows))
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

                label.children[0].addEventListener('mousemove', function () { //dynamic styling
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






document.querySelectorAll('input, select').forEach(input =>
    input.addEventListener('input', function () { //call functions on input
        a = 0
        b = 0
        checkIfValueIsAllowed(this) //value validation
        checkAdditionalQuestions(this) //check for additional questions
        updateProgressbar(this) //progress-bar
        updateProgressIndicators(this) //progress indicator
        updateTotalSum(this) //total income
        fixSelectFocus(this) //fix select focus state
        calculateSaldo() //calculate saldo
        calcMoneyPile()
    }))
document.querySelectorAll('input, select').forEach(input =>
    input.addEventListener('keydown', function (e) {
        pressedKey = e //keep track of last pressed key (needed for form-verification)
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





function checkAdditionalQuestions(currentEl) { //make inputs valid/invalid for progress
    const uw_uitgaven_koop = document.querySelectorAll('[data_question="5"] fieldset:last-of-type input, #hypotheekPerMaand, #woz'),
        uw_uitgaven_huur = document.querySelectorAll('[data_question="5"] fieldset:first-of-type input, #huurPerMaand')

    if (currentEl === document.getElementById('wel-partner')) { //wel partner
        for (const input of document.querySelectorAll('[data_question="2"] > fieldset:nth-of-type(2) input')) {
            input.setAttribute('data_path', true)
        }
        document.getElementById('partnersInkomen').classList.remove('hide')
    } else if (currentEl === document.getElementById('geen-partner')) { //geen partner
        for (const input of document.querySelectorAll('[data_question="2"] > fieldset:nth-of-type(2) input')) {
            input.setAttribute('data_path', false)
            input.value = "" //reset all values 
        }
        document.getElementById('partnersInkomen').classList.add('hide')
    } else if (currentEl === document.getElementById('kinderen')) { //kinderen
        const allChildren = document.querySelectorAll('[data_question="1"]>div:not(#progressive_disclosure) input, [data_question="1"]>div:not(#progressive_disclosure) label')
        for (const child of allChildren) {
            child.classList.add('hide')
            if (child.tagName === 'INPUT') {
                child.setAttribute('data_path', false)
            }
        }
        for (let i = 1; i < parseInt(currentEl.value) + 1; i++) { //toggle children data & styling
            document.querySelector('#kind' + i).classList.remove('hide')
            document.querySelector('#kind' + i).setAttribute('data_path', true)
            document.querySelector('[for="kind' + i + '"]').classList.remove('hide')
        }
    } else if (currentEl === document.getElementById('huur')) { //huur
        document.getElementById('showHuur').classList.remove('hide')
        document.getElementById('showKoop').classList.add('hide')
        document.querySelector('[data_question="5"] fieldset:first-of-type').classList.remove('hide')
        for (const item of uw_uitgaven_huur) {
            item.setAttribute('data_path', true)
        }
        document.querySelector('[data_question="5"] fieldset:last-of-type').classList.add('hide')
        for (const item of uw_uitgaven_koop) {
            item.setAttribute('data_path', false)
        }
    } else if (currentEl === document.getElementById('koop')) { //koop
        document.getElementById('showHuur').classList.add('hide')
        document.getElementById('showKoop').classList.remove('hide')
        document.querySelector('[data_question="5"] fieldset:last-of-type').classList.remove('hide')
        for (const item of uw_uitgaven_koop) {
            item.setAttribute('data_path', true)
        }
        document.querySelector('[data_question="5"] fieldset:first-of-type').classList.add('hide')
        for (const item of uw_uitgaven_huur) {
            item.setAttribute('data_path', false)
        }
    } else if (currentEl === document.getElementById('car')) { //car (excluding second car)
        if (document.getElementById('car').value != 'geen') { //show car
            document.querySelector('[data_question="12"] > div:last-of-type').classList.remove('hide')
            document.querySelector('[for="openbaar_vervoer"]').classList.remove('fixWithHide')
            const uw_uitgaven_car = document.querySelectorAll('[data_question="12"] > div:last-of-type input, #kilometers, #nieuw, #tweedehands')
            for (const item of uw_uitgaven_car) {
                item.setAttribute('data_path', true)
            }
        } else { //reset & hide car
            document.querySelector('[data_question="12"] > div:last-of-type').classList.add('hide')
            document.querySelector('[for="openbaar_vervoer"]').classList.add('fixWithHide')
            const uw_uitgaven_car1 = document.querySelectorAll('[data_question="12"] > div:last-of-type input, #kilometers, #nieuw, #tweedehands')
            for (const item of uw_uitgaven_car1) {
                item.setAttribute('data_path', false)
            }
        }
    }

    //update all progress & subtotal values
    updateProgressbar(document.querySelector('section:first-of-type input:first-of-type'))
    updateProgressbar(document.querySelector('section:nth-of-type(2) input:first-of-type'))
    for (const question of document.querySelectorAll('[data_question]')) {
        updateProgressIndicators(question)
        updateTotalSum(question)
    }
}





function updateProgressbar(currentForm) {
    while (currentForm.tagName != 'SECTION') {
        currentForm = currentForm.parentElement //bubble to the current form
    }

    let inputsWithValue = 0,
        numberOfTotalRadio = 0,
        allInputs = currentForm.querySelectorAll('[data_path="true"]') //get all valid inputs of current form

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
    let uniqueInputs = allInputs.length - (numberOfTotalRadio / 2), //compensate for the radio buttons (double input tags in HTML)
        progression = currentForm.querySelector('.progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue
    currentForm.querySelector('.progression').style.paddingRight = progression + "px" //calculating progress & updating in DOM/styling

    let hasInvalidValue = false
    for (const input of allInputs) {
        if (input.classList.contains('invalid')) { //checking for invalid values
            hasInvalidValue = true
        }
    }
    if (inputsWithValue === uniqueInputs && hasInvalidValue === false) { //hide & fixing styling
        let currentEl = event.target

        if (currentForm === document.querySelector('section:first-of-type') && currentForm.contains(currentEl)) {
            document.querySelector('section:nth-of-type(2)').classList.remove('hide')
            document.getElementById('scroll_indicator').classList.add('inactive')
            document.getElementById('scroll_indicator_uw_situatie').classList.remove('inactive')
            if (a === 0) {
                determineYourSituation() //when all uw_situatie questions are answered -> create a personal household object
                a++
            }
        } else if (currentForm === document.querySelector('section:nth-of-type(2)') && currentForm.contains(currentEl)) {
            document.getElementById('scroll_indicator_uw_situatie').classList.add('inactive')
            document.getElementById('scroll_indicator_uw_uitgaven').classList.remove('inactive')
            if (b === 0) {
                sumExpenses()
                b++
            }
        }
    } else {
        currentForm.querySelector('.progression').classList.add('invalidProgress')
    }
    if (currentForm === document.querySelector('section:first-of-type') && hasInvalidValue === true ||
        currentForm === document.querySelector('section:first-of-type') && inputsWithValue != uniqueInputs) {
        document.querySelector('section:nth-of-type(2)').classList.add('hide') //comment deze regel om uw_uitgaven makkelijker te kunnen testen (moet er ook een in HTML commenten)
    }
    if (hasInvalidValue === false) {
        currentForm.querySelector('.progression').classList.remove('invalidProgress') //reset styling if all invalid values have been corrected
    }

    //determine show/hide state of uw_resultaat (saldo)
    if (currentForm === document.querySelector('section:nth-of-type(2)') && uniqueInputs === inputsWithValue && hasInvalidValue === false) {
        document.getElementById('uw_resultaat').classList.remove('hide')
    } else if (currentForm === document.querySelector('section:nth-of-type(2)') && currentForm.contains(event.target) && uniqueInputs != inputsWithValue ||
        currentForm === document.querySelector('section:nth-of-type(2)') && currentForm.contains(event.target) && hasInvalidValue === true ||
        currentForm === document.querySelector('section:first-of-type') && currentForm.contains(event.target) && uniqueInputs != inputsWithValue ||
        currentForm === document.querySelector('section:first-of-type') && currentForm.contains(event.target) && hasInvalidValue === true) {
        document.getElementById('uw_resultaat').classList.add('hide')
    }
}





function updateProgressIndicators(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }

    let allCurrentInputs = currentEl.querySelectorAll('[data_path="true"]'), //all currently [data-path="true"] inputs
        answeredQuestions = 0,
        numberOfRadios = 0,
        hasInvalidValue = 0

    for (const currentInput of allCurrentInputs) {
        if (currentInput.type === 'radio' && currentInput.checked === true || currentInput.type !== 'radio' && currentInput.value != '') { //check for answers
            answeredQuestions++
        }
        if (currentInput.type === 'radio') { //check for radio input
            numberOfRadios++
        }
        if (currentInput.classList.contains('invalid')) { //check for invalid values
            hasInvalidValue++
        }
    }

    if (answeredQuestions === allCurrentInputs.length - (numberOfRadios / 2)) { //style progress-indicator color if all questions are answered
        currentEl.querySelector('div>span:first-of-type').classList.add('hasAnswer')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('hasAnswer')
    }

    if (hasInvalidValue) { //fix styling for invalid values
        currentEl.querySelector('div>span:first-of-type').classList.add('invalidValue')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('invalidValue')
    }

    if (secondCar === false && currentEl.getAttribute('data_question') === '4' && document.getElementById('car').value != 'geen' && currentEl.querySelector('div > span:first-of-type').classList.contains('hasAnswer')) {
        document.getElementById('extraAuto').classList.remove('hide') //hide extraAuto option
    }
}




//total income
function updateTotalSum(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement //bubble to the question-category
    }
    const allCurrentInputs = currentEl.querySelectorAll('input[data_path="true"]')
    let totalSum = 0,
        questionsAnswered = 0

    if (currentEl.contains(currentEl.querySelector('.sub_total'))) { //check if current category has a sub-total display
        const totalDisplay = currentEl.querySelector('.sub_total')

        for (const currentInput of allCurrentInputs) { //fix the total income
            if (currentInput.value != '') {
                const subTotalText = totalDisplay.textContent.split(':')[0] //get category-specific text
                totalSum = totalSum + parseInt(currentInput.value) //add newly added input

                totalDisplay.textContent = subTotalText + ": " + totalSum + " euro"
                totalDisplay.classList.remove('hide')
                questionsAnswered++
            }
        }

        if (questionsAnswered === 0) { //hide sub_total if no question has been answered
            totalDisplay.classList.add('hide')
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
            this.querySelectorAll('input[data_path="true"], select')[0].focus() //when opening a new question-category -> give first input focus
        }
    }, false)
})





//car styling
document.getElementById('car').addEventListener('input', function () { //fix car styling
    if (this.value != 'geen') {
        document.getElementById('has_a_car').classList.remove('hide') //if user doesn;t have a car -> hide additional questions
    } else {
        document.getElementById('has_a_car').classList.add('hide') //if user has a car -> show additional questions
    }
})
document.getElementById('extraAuto').addEventListener('click', function () { //add additional car
    //fix styling
    document.getElementById('has_a_second_car').classList.remove('hide')
    document.getElementById('extraAuto').classList.add('hide')
    secondCar = true

    //fix progress
    document.getElementById('car2').setAttribute('data_path', true)
    updateProgressIndicators(document.querySelector('[data_question="4"]'))
    updateProgressbar(this)
})
document.getElementById('has_a_second_car').addEventListener('input', function () {
    const allSecondCarQuestions = document.getElementById('has_a_second_car').querySelectorAll('label[for="autotype2"], label[for="kilometers2"], #has_a_second_car .select-box:nth-of-type(2), #waardeAuto, #nieuw2, label[for="nieuw2"], #tweedehands2, label[for="tweedehands2"]')
    if (event.target.value != 'geen') {
        for (const question of allSecondCarQuestions) {
            question.classList.remove('hide') //show last second-car questions
        } //fix progress
        document.getElementById('kilometers2').setAttribute('data_path', true)
        document.getElementById('nieuw2').setAttribute('data_path', true)
        document.getElementById('tweedehands2').setAttribute('data_path', true)
        updateProgressIndicators(document.querySelector('[data_question="4"]'))
        updateProgressbar(this)
    } else {
        for (const question of allSecondCarQuestions) {
            question.classList.add('hide') //hide additional questions
        } //fix progress
        document.querySelector('label[for="autotype2"]').classList.remove('hide')
        document.getElementById('kilometers2').setAttribute('data_path', false)
        document.getElementById('nieuw2').setAttribute('data_path', false)
        document.getElementById('tweedehands2').setAttribute('data_path', false)
        updateProgressIndicators(document.querySelector('[data_question="4"]'))
        updateProgressbar(this)
    }
})




function calculateSaldo() { //calculate the saldo 'overview'
    const yourIncomeInputs = document.querySelectorAll('[data_question="2"] input[type="number"][data_path="true"]'),
        yourExpensesInputs = document.querySelectorAll('section:nth-of-type(2) form input[type="number"][data_path="true"]')

    let yourIncomeSaldo = 0,
        yourExpensesSaldo = 0

    for (const input of yourIncomeInputs) {
        yourIncomeSaldo = yourIncomeSaldo + parseInt(input.value)
    }
    document.getElementById('totaleInkomen').textContent = "€ " + yourIncomeSaldo

    for (const input of yourExpensesInputs) {
        yourExpensesSaldo = yourExpensesSaldo + parseInt(input.value)
    }
    document.getElementById('totaleUitgaven').textContent = "€ " + yourExpensesSaldo

    document.getElementById('saldo').textContent = "€ " + (yourIncomeSaldo - yourExpensesSaldo) //fix color 
    if (yourIncomeSaldo - yourExpensesSaldo > -1) {
        document.getElementById('saldo').classList.remove('negative')
    } else {
        document.getElementById('saldo').classList.add('negative')
    }
}




let personalHousehold = { //keep track of personal household 
    huishoudType: null,
    inkomen: null,
    totaleUitgaven: null,
    uitgavenPosten: null
}

function determineYourSituation() { //create personal houseHold Object with uw_sitautie data/input
    let yourSituation = {}

    document.querySelectorAll('#uw_situatie form input[type="number"], #uw_situatie form input:checked, #uw_situatie form select').forEach(input => {
        if (input.type == "number") {
            yourSituation[input.id] = parseInt(input.value)
        }
        if (input.type == "radio") {
            yourSituation[input.name] = input.value
        }
        if (input.type == "select-one") {
            yourSituation[input.id] = input.value
        }
    })

    //all possibilities
    if (yourSituation.partner == "false" && yourSituation.leeftijd < 67 && yourSituation.kinderen == 0) {
        personalHousehold.huishoudType = "alleenstaand"
    }
    if (yourSituation.partner == "false" && yourSituation.leeftijd >= 67 && yourSituation.kinderen == 0) {
        personalHousehold.huishoudType = "alleenstaand aow"
    }
    if (yourSituation.partner == "false" && yourSituation.kinderen == 1) {
        personalHousehold.huishoudType = "eenouder met 1 kind"
    }
    if (yourSituation.partner == "false" && yourSituation.kinderen == 2) {
        personalHousehold.huishoudType = "eenouder met 2 kinderen"
    }
    if (yourSituation.partner == "false" && yourSituation.kinderen == 3) {
        personalHousehold.huishoudType = "eenouder met 3 kinderen"
    }
    if (yourSituation.partner == "true" && yourSituation.kinderen == 0) {
        personalHousehold.huishoudType = "paar zonder kinderen"
    }
    if (yourSituation.partner == "true" && yourSituation.leeftijd >= 67) {
        personalHousehold.huishoudType = "ouder paar"
    }
    if (yourSituation.partner == "true" && yourSituation.kinderen == 1) {
        personalHousehold.huishoudType = "paar met 1 kind"
    }
    if (yourSituation.partner == "true" && yourSituation.kinderen == 2) {
        personalHousehold.huishoudType = "paar met 2 kinderen"
    }
    if (yourSituation.partner == "true" && yourSituation.kinderen == 3) {
        personalHousehold.huishoudType = "paar met 3 kinderen"
    }

    let income //calc personal income
    if (yourSituation.partner == "false") {
        income = yourSituation.netto_maandinkomen + yourSituation.netto_vakantiegeld + yourSituation.reiskostenvergoeding + yourSituation.dertiende_maand + yourSituation.bijverdiensten + yourSituation.kinderbijslag + yourSituation.zorgtoeslag + yourSituation.kindgebonden_budget + yourSituation.huurtoeslag + yourSituation.kinderopvangtoeslag + yourSituation.teruggave_belasting + yourSituation.alimentatie + yourSituation.kostgeld_inwonende_personen + yourSituation.inkomsten_uit_vermogen + yourSituation.gemeentelijke_ondersteuning + yourSituation.overige_inkomsten
    }
    if (yourSituation.partner == "true") {
        income = yourSituation.netto_maandinkomen + yourSituation.netto_vakantiegeld + yourSituation.reiskostenvergoeding + yourSituation.dertiende_maand + yourSituation.bijverdiensten + yourSituation.netto_maandinkomenPartner + yourSituation.netto_vakantiegeldPartner + yourSituation.reiskostenvergoedingPartner + yourSituation.dertiende_maandPartner + yourSituation.bijverdienstenPartner + yourSituation.kinderbijslag + yourSituation.zorgtoeslag + yourSituation.kindgebonden_budget + yourSituation.huurtoeslag + yourSituation.kinderopvangtoeslag + yourSituation.teruggave_belasting + yourSituation.alimentatie + yourSituation.kostgeld_inwonende_personen + yourSituation.inkomsten_uit_vermogen + yourSituation.gemeentelijke_ondersteuning + yourSituation.overige_inkomsten
    }
    personalHousehold.inkomen = income
}

function sumExpenses() { //calc epxenses
    let yourExpenses = {},
        expenseArray,
        cost = 0

    document.querySelectorAll('#uw_uitgaven [data_path="true"]').forEach(input => {
        yourExpenses[input.id] = parseInt(input.value)

        expenseArray = [{ //all possibilities
                post: "huur/hypotheek",
                bedrag: calculateCategoryCost(5, cost)
            },
            {
                post: "gas",
                bedrag: yourExpenses.gas
            },
            {
                post: "elektriciteit",
                bedrag: yourExpenses.elektriciteit
            },
            {
                post: "water",
                bedrag: yourExpenses.water
            },
            {
                post: "lokale lasten",
                bedrag: calculateCategoryCost(7, cost)
            },
            {
                post: "telefoon, televisie, internet",
                bedrag: calculateCategoryCost(8, cost)
            },
            {
                post: "verzekeringen",
                bedrag: calculateCategoryCost(9, cost)
            },
            {
                post: "onderwijs",
                bedrag: yourExpenses.schoolkosten_kinderen + yourExpenses.studiekosten_volwassenen
            },
            {
                post: "kinderopvang",
                bedrag: yourExpenses.kinderopvang
            },
            {
                post: "contributies en abonnementen",
                bedrag: calculateCategoryCost(11, cost)
            },
            {
                post: "vervoer",
                bedrag: calculateCategoryCost(12, cost)
            },
            {
                post: "kleding en schoenen",
                bedrag: yourExpenses.kleding_en_schoenen
            },
            {
                post: "inventaris",
                bedrag: yourExpenses.inventaris
            },
            {
                post: "onderhoud huis en tuin",
                bedrag: yourExpenses.onderhoud_huis_en_tuin
            },
            {
                post: "niet-vergoede ziektekosten",
                bedrag: yourExpenses.zelfzorgmiddelen + yourExpenses.eigen_risico_zorgverzekering + yourExpenses.eigen_bijdragen_en_betalingen_zorg
            },
            {
                post: "vrijetijdsuitgaven",
                bedrag: yourExpenses.vrijetijdsuitgaven
            },
            {
                post: "voeding",
                bedrag: yourExpenses.voeding
            },
            {
                post: "overige huishoudelijke uitgaven",
                bedrag: yourExpenses.was_en_schoonmaakartikelen + yourExpenses.persoonlijke_verzorging + yourExpenses.huishoudelijke_dienstverlening + yourExpenses.huisdieren + yourExpenses.roken + yourExpenses.diversen
            }
        ]
    })
    personalHousehold.uitgavenPosten = expenseArray
    personalHousehold.totaleUitgaven = 0
    for (const expense of personalHousehold.uitgavenPosten) {
        personalHousehold.totaleUitgaven = personalHousehold.totaleUitgaven + expense.bedrag
    }
    findMatchingHousehold() //match your personal household with a household form the database
}

function calculateCategoryCost(category, cost) { //calc the cost of all inputs in the passed category
    cost = 0

    document.querySelectorAll('[data_question="' + category + '"] [data_path="true"]').forEach(input => {
        cost = cost + parseInt(input.value)
    })
    return cost
}


function findMatchingHousehold() { //find a matching household -> most similar to personal household
    let matchingHouseHoldType = allDataHouseHolds.filter(data => data.huishoudType === personalHousehold.huishoudType), //filter on houseHoldType
        smallestDifference = 1000000 //good default is so big it'll definitely be overwritten

    for (const houseHold of matchingHouseHoldType) { //check how big the income difference is
        let arr = [personalHousehold, houseHold].sort((lowest, highest) => highest.inkomen - lowest.inkomen)
        let difference = arr[0].inkomen - arr[1].inkomen

        if (difference <= smallestDifference) {
            smallestDifference = difference //update smallesDifference
        }
    }

    let matches = matchingHouseHoldType.filter(data => { //filter out all mismatches depending on income (using smallesDifference)
        if (data.inkomen === personalHousehold.inkomen + smallestDifference || data.inkomen === personalHousehold.inkomen - smallestDifference) {
            return true
        } else {
            return false
        }
    })

    for (const match of matches) { //calc the difference for each match (best match has smallest difference)
        let difference
        if (personalHousehold.uitgavenPosten[0].bedrag >= match.uitgavenPosten[0].bedrag) {
            difference = personalHousehold.uitgavenPosten[0].bedrag - match.uitgavenPosten[0].bedrag
        } else if (personalHousehold.uitgavenPosten[0].bedrag <= match.uitgavenPosten[0].bedrag) {
            difference = Math.abs(personalHousehold.uitgavenPosten[0].bedrag - match.uitgavenPosten[0].bedrag)
        }
        match["difference"] = difference
    }

    matches.sort((highest, lowest) => highest.difference - lowest.difference) //sort matches from best - worst
    matchingHouseHold = matches[0]
}




const simsInputs = document.querySelectorAll('#wel-partner, #geen-partner, #kinderen, #woningtype, #car')
simsInputs.forEach(input => { //determine what sims image should be shown
    input.addEventListener('input', function () {

        if (input.id == "wel-partner") { //partner
            document.getElementById('simsVrouw').src = "media/sims/vrouw.svg"
            document.getElementById('simsVrouw').classList.add('animation_target')
        }
        if (input.id == "geen-partner") {
            document.getElementById('simsVrouw').src = ""
        }
        if (input.id == "kinderen" && input.className != "invalid") { //children
            for (let i = 1; i < document.querySelectorAll('#simsKind1, #simsKind2, #simsKind3, #simsKind4, #simsKind5').length + 1; i++) {
                document.querySelector('#simsKind' + i).src = ""

                if (i < parseInt(input.value) + 1) {
                    document.querySelector('#simsKind' + i).src = "media/sims/kind" + i + ".svg"
                    document.querySelector('#simsKind' + i).classList.add('animation_target')
                }
            }
        }
        if (input.id == "woningtype") { //house
            if (input.value === 'appartement') {
                document.getElementById('simsHuis').src = "media/sims/appartement_huis.svg"
                document.getElementById('simsHuis').classList.add('animation_target')
            } else if (input.value === 'tussenwoning') {
                document.getElementById('simsHuis').src = "media/sims/tussenwoning_huis.svg"
                document.getElementById('simsHuis').classList.add('animation_target')
            } else if (input.value === 'hoekwoning') {
                document.getElementById('simsHuis').src = "media/sims/hoekwoning_huis.svg"
                document.getElementById('simsHuis').classList.add('animation_target')
            } else if (input.value === 'vrijstaand') {
                document.getElementById('simsHuis').src = "media/sims/vrijstaand_huis.svg"
                document.getElementById('simsHuis').classList.add('animation_target')
            }
        }
        if (input.id == "car") { //car
            if (input.value === 'geen') {
                document.getElementById('simsAuto').src = ""
            } else if (input.value === 'klein') {
                document.getElementById('simsAuto').src = "media/sims/kleine_auto.svg"
                document.getElementById('simsAuto').classList.add('animation_target')
            } else if (input.value === 'compact') {
                document.getElementById('simsAuto').src = "media/sims/compacte_auto.svg"
                document.getElementById('simsAuto').classList.add('animation_target')
            } else if (input.value === 'compact_middenklasse') {
                document.getElementById('simsAuto').src = "media/sims/compacte_middenklasse_auto.svg"
                document.getElementById('simsAuto').classList.add('animation_target')
            } else if (input.value === 'middenklasse') {
                document.getElementById('simsAuto').src = "media/sims/middenklasse_auto.svg"
                document.getElementById('simsAuto').classList.add('animation_target')
            }
        }
    })
})




document.getElementById('demo').addEventListener('click', function () { //super secret demo function (fills in all inputs for easy testing)
    for (const item of document.querySelectorAll('[data_path="true"]')) {
        if (item.type == "number") {
            item.value = 20
        } else if (item.tagName != 'INPUT') {
            item.value = item.querySelector('option:nth-of-type(2)').value
        } else {
            item.checked = true
        }
        document.querySelector('#kinderen').value = 0
    }

    document.getElementById('cheatPopUp').classList.remove('invisible')
    setTimeout(function () { //show cheat mode popup animation
        document.getElementById('cheatPopUp').classList.add('invisible')
    }, 3000);
})

document.addEventListener('scroll', function () { //hide demo button on scroll in barchart viewport + fix scroll indicators visibilities
    const demoButton = document.getElementById('demo'),
        secondSection = document.querySelector('section:nth-of-type(2)')

    //hide scroll Indicators on specific scroll positions
    if (document.getElementById('uw_situatie').getBoundingClientRect().top < 30) {
        document.querySelector('#scroll_indicator').classList.add('inactive')
    }
    if (document.querySelector('section:nth-of-type(2)').getBoundingClientRect().top < 30) {
        document.querySelector('#scroll_indicator_uw_situatie').classList.add('inactive')
    }
    if (document.querySelector('#uw_resultaat').getBoundingClientRect().top < 30) {
        document.querySelector('#scroll_indicator_uw_uitgaven').classList.add('inactive')
    }

    //hide the demo button in the uw_uitgaven viewport
    if (secondSection.classList.contains('hide') === false && window.scrollY + secondSection.getBoundingClientRect().top < window.scrollY + demoButton.getBoundingClientRect().top + demoButton.getBoundingClientRect().height) {
        demoButton.classList.add('invisible')
    }
    if (window.scrollY + secondSection.getBoundingClientRect().top > window.scrollY + demoButton.getBoundingClientRect().top + demoButton.getBoundingClientRect().height ||
        window.scrollY + secondSection.getBoundingClientRect().bottom < window.scrollY + demoButton.getBoundingClientRect().top) {
        demoButton.classList.remove('invisible')
    }
})

document.querySelector('#scroll_indicator').addEventListener('click', function () { //auto scroll
    document.getElementById('uw_situatie').scrollIntoView({
        behavior: "smooth",
        block: "end"
    })
})
document.querySelector('#scroll_indicator_uw_situatie').addEventListener('click', function () { //auto scroll
    document.querySelector('section:nth-of-type(2)').scrollIntoView({
        behavior: "smooth",
        block: "end"
    })
})
document.querySelector('#scroll_indicator_uw_uitgaven').addEventListener('click', function () { //auto scroll
    document.getElementById('uw_resultaat').scrollIntoView({
        behavior: "smooth",
        block: "end"
    })
})
for (const indicator of document.querySelectorAll('.scrollIndicator')) { //hide scroll indicators when they're clicked
    indicator.addEventListener('click', function () {
        let currentIndicator = event.target
        while (currentIndicator.tagName != 'DIV') {
            currentIndicator = currentIndicator.parentElement
        }
        currentIndicator.classList.add('inactive')
    })
}







document.querySelector('#d3-start').addEventListener('click', createBarchart)

function createBarchart() {
    let data = transformDataForD3()

    let zippedData = []
    for (let i = 0; i < data.labels.length; i++) {
        for (let j = 0; j < data.bars.length; j++) {
            zippedData.push(data.bars[j].values[i])
        }
    }

    // D3 variables
    let width = document.querySelector('.chart').getBoundingClientRect().width,
        chart = d3.select('.chart'),
        barHeight = 35,
        groupHeight = barHeight * data.bars.length,
        gapBetweenGroups = 10,
        spaceForLabels = 150,
        barchartFallbackColor = getComputedStyle(document.documentElement).getPropertyValue('--yourHousehold-normal-color'),
        matchedHouseholdColor = getComputedStyle(document.documentElement).getPropertyValue('--matchedHousehold-color')


    // Color scale
    let color = d3.scaleOrdinal()
        .range([barchartFallbackColor, matchedHouseholdColor])

    let x = d3.scaleLinear()
        .domain([0, d3.max(zippedData)])
        .range([0, width])

    // Create bars
    let bar = chart.selectAll('g')
        .data(zippedData)
        .enter().append('g')
        .attr('transform', (d, i) => 'translate(' + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / data.bars.length))) + ')')

    bar.append('rect')
        .attr('fill', (d, i) => color(i % data.bars.length))
        .attr('width', x)
        .attr('height', barHeight)

    // Draw labels
    bar.append('text')
        .attr('x', (d, i) => -10)
        .attr('y', groupHeight / 2)
        .text(function (d, i) {
            if (i % data.bars.length === 0) {
                return data.labels[Math.floor(i / data.bars.length)]
            } else {
                return ""
            }
        })
        .attr('class', 'label')
}

// Merges the dataset structure to our own structure which is determined by the form
function mergeDataObjects(object) {
    let objectStructure = [{
            post: "woning",
            bedrag: object.uitgavenPosten[0].bedrag
        },
        {
            post: "energie",
            bedrag: object.uitgavenPosten[1].bedrag + object.uitgavenPosten[2].bedrag + object.uitgavenPosten[3].bedrag
        },
        {
            post: "lokale lasten",
            bedrag: object.uitgavenPosten[4].bedrag
        },
        {
            post: "telefoon, televisie, internet",
            bedrag: object.uitgavenPosten[5].bedrag
        },
        {
            post: "verzekeringen",
            bedrag: object.uitgavenPosten[6].bedrag
        },
        {
            post: "onderwijs",
            bedrag: object.uitgavenPosten[7].bedrag + object.uitgavenPosten[8].bedrag
        },
        {
            post: "contributies en abonnementen",
            bedrag: object.uitgavenPosten[9].bedrag
        },
        {
            post: "vervoer",
            bedrag: object.uitgavenPosten[10].bedrag
        },
        {
            post: "reserveringsuitgaven",
            bedrag: object.uitgavenPosten[11].bedrag + object.uitgavenPosten[12].bedrag + object.uitgavenPosten[13].bedrag + object.uitgavenPosten[14].bedrag + object.uitgavenPosten[15].bedrag
        },
        {
            post: "huishoudelijke uitgaven",
            bedrag: object.uitgavenPosten[16].bedrag + object.uitgavenPosten[17].bedrag
        }
    ]

    return objectStructure
}

// Creates 1 object with keys and values of both household for the same category
function transformDataForD3() {
    const yourHouseHold = mergeDataObjects(personalHousehold),
        matchedHousehold = mergeDataObjects(matchingHouseHold)

    console.log(yourHouseHold)
    console.log(matchedHousehold)

    const categories = [],
        averageValues = []
    matchedHousehold.forEach(category => {
        categories.push(category.post)
        averageValues.push(category.bedrag)
    })

    const personalValues = []
    yourHouseHold.forEach(category => {
        personalValues.push(category.bedrag)
    })

    const data = {
        labels: categories,
        bars: [{
                label: 'personal_values',
                values: personalValues
            },
            {
                label: 'average_values',
                values: averageValues
            }
        ]
    }
    return data
}

function calcMoneyPile() {
    const moneyPile = document.getElementById('moneyPile')

    let yourIncomeMoney = 0,
        yourExpensesMoney = 0

    for (const money of document.querySelectorAll('[data_question="2"] input[type="number"][data_path="true"]')) {
        yourIncomeMoney = yourIncomeMoney + parseInt(money.value)
    }
    for (const money of document.querySelectorAll('section:nth-of-type(2) input[type="number"][data_path="true"]')) {
        if (parseInt(money.value) >= 0) {
            yourExpensesMoney = yourExpensesMoney + parseInt(money.value)
        }
    }

    if ((yourExpensesMoney / yourIncomeMoney) * money.getBoundingClientRect().height >= 550) {
        moneyPile.style.marginTop = "550px"
    } else {
        moneyPile.style.marginTop = (yourExpensesMoney / yourIncomeMoney) * money.getBoundingClientRect().height + "px"
    }
}