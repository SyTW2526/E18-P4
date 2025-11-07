describe('API E2E: users', () => {
  const base = Cypress.env('API_BASE') || 'http://localhost:5200'

  it('GET /users should return an array (server must be running)', () => {
    cy.request({ method: 'GET', url: `${base}/users/` }).then((resp) => {
      expect(resp.status).to.equal(200)
      expect(Array.isArray(resp.body)).to.be.true
    })
  })

  it('signup -> signin flow (integration)', () => {
    const email = `cypress+${Date.now()}@example.com`
    const user = { nombre: 'Cypress', email, password: 'Test1234' }

    // signup
    cy.request({ method: 'POST', url: `${base}/users/signup`, body: user }).then((res) => {
      expect(res.status).to.equal(201)
      expect(res.body).to.have.property('token')
      const token = res.body.token

      // signin
      cy.request({ method: 'POST', url: `${base}/users/signin`, body: { email, password: 'Test1234' } }).then((s) => {
        expect(s.status).to.equal(200)
        expect(s.body).to.have.property('token')
      })
    })
  })
})
