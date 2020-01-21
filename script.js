import data from './modules/loadData.js'
import transform from './modules/transformData.js'


const allQuestionCategories = d3.selectAll('.question_category')._groups[0],
    labels = document.querySelectorAll('form label'),
    tooltip = document.querySelector('#tooltip'),
    digitRegex = /^\d+$/


let tooltipData, //receives toolltip-data (async)
    bespaarTips,
    pressedKey, //last fired event.key
    secondCar = false,
    a,
    b,
    c,
    allDataHouseHolds,
    matchingHouseHold

document.getElementById('moneyIndicator').classList.add('hide')


data.getData() //fetch dataset-data
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => allDataHouseHolds = transform.createHousehold(csvRows))
    .catch(err => console.log(err))

data.getTooltips() //fetch tooltip-data
    .then(data => tooltipData = data)
    .then(data => addTooltips())
    .catch(err => console.log(err))

data.getHighestExpenses() //fetch tooltip-data
    .then(data => bespaarTips = data)
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
        c = 0
        checkIfValueIsAllowed(this) //value validation
        checkAdditionalQuestions(this) //check for additional questions
        updateProgressbar(this) //progress-bar
        updateProgressIndicators(this) //progress indicator
        updateTotalSum(this) //total income
        fixSelectFocus(this) //fix select focus state
        calculateSaldo() //calculate saldo
        calcMoneyPile()
        getHighestExpenses()
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

        // Laat uw uitgaven zien
        // functie aanroepen voor het aanmaken van een lege barchart, met het object dus met 0-waardes
        if (currentForm === document.querySelector('section:first-of-type') && currentForm.contains(currentEl)) {
            document.querySelector('section:nth-of-type(2)').classList.remove('hide')
            document.getElementById('scroll_indicator').classList.add('inactive')
            document.getElementById('scroll_indicator_uw_situatie').classList.remove('inactive')
            if (a === 0) {
                determineYourSituation() //when all uw_situatie questions are answered -> create a personal household object
                sumExpenses()
                findMatchingHousehold() //match your personal household with a household form the database

                createBarChartZeroState()
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

    if (c === 0) {
        if (currentEl.classList.contains('hide') === false && currentEl.getAttribute('data_question') > 4) {
            c++
            let numberOfQuestions = 0,
                currentAnsweredQuestions = 0
            for (const input of currentEl.querySelectorAll('[data_path="true"]')) {
                numberOfQuestions++
                if (input.value != "") {
                    currentAnsweredQuestions++
                }
            }

            if (numberOfQuestions === currentAnsweredQuestions) {
                let expensesFieldset = currentEl.querySelectorAll('[data_path="true"]'),
                    expenseFieldsetTotal = 0

                expensesFieldset.forEach(expense => {
                    expenseFieldsetTotal = expenseFieldsetTotal + parseInt(expense.value)
                })

                householdZerostate.forEach(post => {
                    if (currentEl.querySelector('legend').textContent.toLowerCase() == post.post) {
                        post.bedragen[0].bedrag = expenseFieldsetTotal
                    }
                })

                let averageHousehold = mergeDataObjects(matchingHouseHold)

                householdZerostate.forEach(personalpost => {
                    if (currentEl.querySelector('legend').textContent.toLowerCase() == personalpost.post) {
                        averageHousehold.forEach(averagepost => {
                            if (personalpost.post === averagepost.post) {
                                personalpost.bedragen[1].bedrag = averagepost.bedrag
                            }
                        })
                    }
                })

                householdZerostate.forEach(post => {
                    if (post.bedragen[0].bedrag != 0) {
                        post.difference = Math.floor((post.bedragen[0].bedrag / post.bedragen[1].bedrag) * 100)
                    } else {
                        post.difference = 0
                    }
                })

                householdZerostate.sort(function (x, y) {
                    return d3.descending(x.difference, y.difference)
                })
                createBarchart(householdZerostate)
            }
        }
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

                totalDisplay.textContent = subTotalText + ": €" + totalSum + ",-"
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

    let saldoDifference = yourIncomeSaldo - yourExpensesSaldo

    if ((saldoDifference / yourIncomeSaldo) * 100 > 5) {
        document.querySelector('#uw_resultaat > div:nth-of-type(1) h2').textContent = "Goed bezig!"
    } else {
        document.querySelector('#uw_resultaat > div:nth-of-type(1) h2').textContent = "Er zijn kansen om geld te besparen!"
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
    if (yourSituation.partner == "false" && yourSituation.kinderen == 3 || yourSituation.partner == "false" && yourSituation.kinderen == 4 || yourSituation.partner == "false" && yourSituation.kinderen == 5) {
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
    if (yourSituation.partner == "true" && yourSituation.kinderen == 3 || yourSituation.partner == "false" && yourSituation.kinderen == 4 || yourSituation.partner == "false" && yourSituation.kinderen == 5) {
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
        document.querySelectorAll('#sims img').forEach(img => {
            img.classList.remove('animation_target')
            img.classList.remove('animation_target_reset')
        })

        if (input.id == "wel-partner") { //partner
            document.getElementById('simsVrouw').src = "media/sims/vrouw.svg"
            document.getElementById('simsVrouw').classList.add('animation_target')
        }
        if (input.id == "geen-partner") {
            document.getElementById('simsVrouw').classList.add('animation_target_reset')
            setTimeout(function resetSRC() {
                document.getElementById('simsVrouw').src = ""
            }, 500)
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
            } else if (input.value === 'tussenwoning') {
                document.getElementById('simsHuis').src = "media/sims/tussenwoning_huis.svg"
            } else if (input.value === 'hoekwoning') {
                document.getElementById('simsHuis').src = "media/sims/hoekwoning_huis.svg"
            } else if (input.value === 'vrijstaand') {
                document.getElementById('simsHuis').src = "media/sims/vrijstaand_huis.svg"
            }
            document.getElementById('simsHuis').classList.add('animation_target')
        }
        if (input.id == "car") { //car
            if (input.value === 'geen') {
                document.getElementById('simsAuto').classList.add('animation_target_reset')
                setTimeout(function resetSRC() {
                    document.getElementById('simsAuto').src = ""
                }, 500)
            } else if (input.value === 'klein') {
                document.getElementById('simsAuto').src = "media/sims/kleine_auto.svg"
            } else if (input.value === 'compact') {
                document.getElementById('simsAuto').src = "media/sims/compacte_auto.svg"
            } else if (input.value === 'compact_middenklasse') {
                document.getElementById('simsAuto').src = "media/sims/compacte_middenklasse_auto.svg"
            } else if (input.value === 'middenklasse') {
                document.getElementById('simsAuto').src = "media/sims/middenklasse_auto.svg"
            }
            document.getElementById('simsAuto').classList.add('animation_target')
        }
    })
})




document.getElementById('demo').addEventListener('click', function () { //super secret demo function (fills in all inputs for easy testing)
    //show the cheat mode enabled pop-up
    document.getElementById('cheatPopUp').classList.remove('invisible')
    setTimeout(function () { //show cheat mode popup animation
        document.getElementById('cheatPopUp').classList.add('invisible')
    }, 2500);

    //give all determining questions a value
    document.getElementById('leeftijd').value = 30
    document.getElementById('wel-partner').checked = true
    document.getElementById('kinderen').value = 2
    document.getElementById('kind1').value = 6
    document.getElementById('kind2').value = 2
    document.getElementById('woningtype').options.selectedIndex = 2
    document.getElementById('bouwjaar').options.selectedIndex = 3
    document.getElementById('huur').checked = true
    document.getElementById('car').options.selectedIndex = 3
    document.getElementById('kilometers').options.selectedIndex = 3
    document.getElementById('nieuw').checked = true

    //remove hide class & set data_path to true for all new questions
    for (const item of document.querySelectorAll('section:nth-of-type(2), #has_a_car, #kind2, [for="kind2"], #kind1, [for="kind1"], #partnersInkomen, #showHuur, [data_question="5"] > fieldset:first-of-type, [data_question="12"] div:nth-of-type(2)')) {
        item.classList.remove('hide')

        if (item.type === 'number') {
            item.setAttribute('data_path', true)
        } else if (item.id === "partnersInkomen" || item.id === "showHuur" || item === document.querySelector('[data_question="5"] > fieldset:first-of-type') || item === document.querySelector('[data_question="12"] div:nth-of-type(2)')) {
            item.querySelectorAll('input[type="number"]').forEach(item => {
                item.setAttribute('data_path', true)
                item.value = 0
            })
        }
    }
    document.querySelector('[data_question="5"]').classList.add('hide')

    for (const item of document.querySelectorAll('[data_path="true"]')) {
        if (item.type == "number" && item.value == "") {
            if (item.id === "netto_maandinkomen") {
                item.value = 2000
            } else if (item.id === "showHuur") {
                item.value = 0 //TODO: vul deze in met dezelfde waarde als huur bij woning in uw_uitgaven
            }
            //TODO: zet hier allemaal if statements voor elke eerste input per category om de waarde te hardcoden
            else {
                item.value = 0
            }
        }
    }

    //show the sims animations
    document.getElementById('simsVrouw').src = "media/sims/vrouw.svg"
    document.getElementById('simsVrouw').classList.add('animation_target')
    for (let i = 1; i < 3; i++) {
        document.querySelector('#simsKind' + i).src = ""
        if (i < 3) {
            document.querySelector('#simsKind' + i).src = "media/sims/kind" + i + ".svg"
            document.querySelector('#simsKind' + i).classList.add('animation_target')
        }
    }
    document.getElementById('simsHuis').src = "media/sims/tussenwoning_huis.svg"
    document.getElementById('simsHuis').classList.add('animation_target')
    document.getElementById('simsAuto').src = "media/sims/compacte_auto.svg"
    document.getElementById('simsAuto').classList.add('animation_target')


    //call all functions to update progress, moneyPile, result etc.
    a = 0
    b = 0
    c = 0
    determineYourSituation() //when all uw_situatie questions are answered -> create a personal household object
    sumExpenses()
    findMatchingHousehold() //match your personal household with a household form the database
    checkIfValueIsAllowed(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //value validation
    checkAdditionalQuestions(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //check for additional questions
    updateProgressbar(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //progress-bar
    createBarChartZeroState()
    updateProgressIndicators(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //progress indicator
    updateTotalSum(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //total income
    fixSelectFocus(document.querySelector('[data_question="7"] input[type="number"][data_path="true"]')) //fix select focus state
    calculateSaldo() //calculate saldo
    calcMoneyPile()
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
    if (document.querySelector('#uw_resultaat').getBoundingClientRect().top < 700) {
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

    //hide/show the moneyPile indicator 
    if (window.scrollY < ((window.innerHeight * 2) - 300) || window.scrollY > ((window.innerHeight * 3) - 300)) {
        document.getElementById('moneyIndicator').classList.add('hide')
    } else {
        document.getElementById('moneyIndicator').classList.remove('hide')
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
            post: "reserverings uitgaven",
            bedrag: object.uitgavenPosten[11].bedrag + object.uitgavenPosten[12].bedrag + object.uitgavenPosten[13].bedrag + object.uitgavenPosten[14].bedrag + object.uitgavenPosten[15].bedrag
        },
        {
            post: "huishoudelijke uitgaven",
            bedrag: object.uitgavenPosten[16].bedrag + object.uitgavenPosten[17].bedrag
        }
    ]

    return objectStructure
}

function calcMoneyPile() {
    const moneyPile = document.getElementById('moneyPile')

    let yourIncomeMoney = 0,
        yourExpensesMoney = 0

    for (const money of document.querySelectorAll('[data_question="2"] input[type="number"][data_path="true"]')) {
        if (parseInt(money.value) >= 0) {
            yourIncomeMoney = yourIncomeMoney + parseInt(money.value)
        }
    }
    for (const money of document.querySelectorAll('section:nth-of-type(2) input[type="number"][data_path="true"]')) {
        if (parseInt(money.value) >= 0) {
            yourExpensesMoney = yourExpensesMoney + parseInt(money.value)
        }
    }

    if ((yourExpensesMoney / yourIncomeMoney) * money.getBoundingClientRect().height >= 550) {
        moneyPile.style.marginTop = "550px"
        document.querySelector('#moneyIndicator').style.marginTop = "550px"
    } else {
        moneyPile.style.marginTop = (yourExpensesMoney / yourIncomeMoney) * money.getBoundingClientRect().height + "px"
        document.querySelector('#moneyIndicator').style.marginTop = (yourExpensesMoney / yourIncomeMoney) * money.getBoundingClientRect().height + "px"
    }

    document.querySelector('#moneyIndicator').innerHTML = "€" + (yourIncomeMoney - yourExpensesMoney) + ",- <span></span>"
}

let householdZerostate = [{
        post: "woning",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "energie",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "lokale lasten",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "telefoon, televisie, internet",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "verzekeringen",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "onderwijs",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "contributies en abonnementen",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "vervoer",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "reserverings uitgaven",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    },
    {
        post: "huishoudelijke uitgaven",
        bedragen: [{
                data: "persoonlijk",
                bedrag: 0
            },
            {
                data: "gemiddeld",
                bedrag: 0
            }
        ],
        difference: 0
    }
]



function createBarChartZeroState() {
    let data = householdZerostate

    let width = document.querySelector('.chart').getBoundingClientRect().width - 190,
        height = document.querySelector('.chart').getBoundingClientRect().height,
        svg = d3.select('.chart')

    let x = d3.scaleLinear()
        .range([width, 0])
        .domain([0, Math.max.apply(Math, data.map(o => (Math.max(o.bedragen[0].bedrag, o.bedragen[1].bedrag))))])

    let y0 = d3.scaleBand()
        .rangeRound([0, height])
        .paddingInner(0.3)
        .domain(data.map(d => d.post.charAt(0).toUpperCase() + d.post.slice(1)))

    let xAxis = d3.axisBottom()
        .scale(x)

    let yAxis = d3.axisLeft()
        .scale(y0)
        .tickSize(0)

    let groups = svg.append('g')
        .attr("transform", "translate(140, 0)")

    // Aanmaken X-as
    groups.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr('class', 'x axis')
        .call(xAxis);

    //Aanmaken Y-as
    groups.append("g")
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll(".tick text")
        .call(wrap, 140)

    let barchart = d3.select('svg > g')
    barchart.selectAll("bars")
        .data(data)
        .enter().append("g")
        .attr("transform", (d => "translate(0," + y0(d.post.charAt(0).toUpperCase() + d.post.slice(1)) + ")"))
        .attr('class', 'group')
}

function createBarchart(data) {
    document.getElementById('legenda').classList.remove('hide')

    // D3 variables
    let width = document.querySelector('.chart').getBoundingClientRect().width - 190,
        height = document.querySelector('.chart').getBoundingClientRect().height,
        matchedHouseholdColor = getComputedStyle(document.documentElement).getPropertyValue('--matchedHousehold-color'),
        svg = d3.select('.chart'),
        rateNames = ['persoonlijk', 'gemiddeld']

    let x = d3.scaleLinear()
        .range([width, 0])
        .domain([0, Math.max.apply(Math, data.map(o => (Math.max(o.bedragen[0].bedrag, o.bedragen[1].bedrag))))])

    let y0 = d3.scaleBand()
        .rangeRound([0, height])
        .paddingInner(0.3)
        .domain(data.map(d => d.post.charAt(0).toUpperCase() + d.post.slice(1)))

    let y1 = d3.scaleBand()
        .domain(rateNames).range([0, y0.bandwidth()])

    let yAxis = d3.axisLeft()
        .scale(y0)
        .tickSize(0)

    d3.select('.y')
        .call(yAxis)
        .selectAll(".tick text")
        .call(wrap, 140)


    let bars = svg.selectAll('.group'),
        bar = bars.selectAll('rect'),
        text = bars.selectAll('text'),
        p = 0

    bars
        .data(data)
        .attr("y", (d => y0(d.difference)))

    bar
        .data((d => d.bedragen))
        .enter().append("rect")
        .attr("height", y1.bandwidth())
        .attr("x", 0)
        .merge(bar)
        .attr("y", (d => y1(d.data)))
        .attr('fill', () => {
            let barColor = matchedHouseholdColor,
                valueDifference
            if (p % 2 === 0) {
                let arr = [data[p / 2].bedragen[0].bedrag, data[p / 2].bedragen[1].bedrag]
                valueDifference = ((arr[0] - arr[1]) / arr[1]) * 100

                if (valueDifference < -15) {
                    barColor = getComputedStyle(document.documentElement).getPropertyValue('--yourHousehold-negative-color')
                } else if (valueDifference > 15) {
                    barColor = getComputedStyle(document.documentElement).getPropertyValue('--yourHousehold-positive-color')
                } else {
                    barColor = getComputedStyle(document.documentElement).getPropertyValue('--yourHousehold-normal-color')
                }
            }
            p++
            return barColor
        })
        .transition().duration(1000)
        .attr("width", function (d) {
            if (d.bedrag != 0) {
                // this.classList.add('hasHadAWidth')
                return width - x(d.bedrag)
            }
            // else if (this.classList.contains('hasHadAWidth')) {
            // return 1
            // } 
            else {
                return 0
            }
        })

    text
        .data((d => d.bedragen))
        .enter().append('text')
        .merge(text)
        .attr("y", (d => y1(d.data) + 18))
        .transition().duration(1000)
        .attr("x", d => width - x(d.bedrag) + 10)
        .text(function (d) {
            if (d.bedrag != 0) {
                // this.classList.add('hasBeenActive')
                return d.bedrag
            }
            // else if (this.classList.contains('hasBeenActive')) {
            // this.classList.remove('hasBeenActive')
            // return 0
            // } 
            else {
                return ''
            }
        })
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,
            x = text.attr('x'),
            y = text.attr('y'),
            dy = 0,
            tspan = text.text(null)
            .append('tspan')
            .attr('x', -10)
            .attr('y', y)
            .attr('dy', dy + 'em')
        while (word = words.pop()) {
            line.push(word)
            tspan.text(line.join(' '))
            if (tspan.node().getComputedTextLength() > width) {
                line.pop()
                tspan.text(line.join(' '))
                line = [word]
                tspan = text.append('tspan')
                    .attr('x', -10)
                    .attr('y', y)
                    .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                    .text(word)
            }
        }
    })
}

// Gets the the top 3 differences and get tooltips
function getHighestExpenses() {
    let top3Expenses = []
    for (let i = 0; i < 3; i++) {
        top3Expenses.push(householdZerostate[i])
    }

    let bespaarTipsArray = []
    top3Expenses.forEach(post => {
        Object.entries(bespaarTips).forEach(tip => {
            if (post.post === tip[0]) {
                bespaarTipsArray.push({
                    post: tip[0].charAt(0).toUpperCase() + tip[0].slice(1),
                    tip: tip[1]
                })
            }
        })
    })

    const bespaarDivs = document.querySelectorAll('#uw_resultaat > div:nth-of-type(3) div')
    for (let i = 0; i < bespaarTipsArray.length; i++) {
        bespaarDivs[i].querySelector('img').src = "./media/sims/" + bespaarTipsArray[i].post + ".svg"
        bespaarDivs[i].querySelector('h4').textContent = bespaarTipsArray[i].post
        bespaarDivs[i].querySelector('p').textContent = bespaarTipsArray[i].tip
    }
}