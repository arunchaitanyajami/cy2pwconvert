Cypress.Commands.add('clickLink', (label) => {
    cy.get('a').contains(label).click()
})

// Download a file
Cypress.Commands.add('downloadFile', (url, directory, fileName) => {
    return cy.getCookies().then((cookies) => {
        return cy.task('downloadFile', {
            url,
            directory,
            cookies,
            fileName,
        })
    })
})
