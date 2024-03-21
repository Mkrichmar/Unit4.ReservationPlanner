require('dotenv').config();

const {
    client,
    createTables,
    createCustomer,
    createRestaurant,
    createReservation,
    fetchCustomers,
    fetchRestaurants,
    fetchReservations,
    destroyReservation
} = require('./db');

const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/customers', async(req, res, next) => {
    try {
        res.send(await fetchCustomers());
    }
    catch(error) {
        next(error)
    }
});

app.get('/api/restaurants', async(req, res, next) => {
    try {
        res.send(await fetchRestaurants());
    }
    catch(error) {
        next(error)
    }
});

app.get('/api/reservations', async(req, res, next) => {
    try {
        res.send(await fetchReservations());
    }
    catch(error) {
        next(error)
    }
});

app.post('/api/customers/:customer_id/reservations', 
async(req, res, next) => {
    try {
        res.status(201).send(await createReservation({ 
            customer_id: req.params.customer_id, 
            restaurant_id: req.body.restaurant_id,
            party_count: req.body.party_count, 
            date: req.body.date 
        }));

    }
    catch(error) {
        next(error)
    }
});

app.delete('/api/customers/:customer_id/reservations/:id', 
async(req, res, next) => {
    try {
        await destroyReservation({ 
            customer_id: req.params.customer_id, 
            id: req.params.id 
        });

    }
    catch(error) {
        next(error)
    }
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).send({ 
        error: err.message || err 
    });
});

const init = async () => {
    await client.connect();
    console.log('db connected');
    await createTables();
    console.log('tables created');

    const [
        Gordon, Roger, Bobby, LeCirque, MomoFuku
    ] = await Promise.all([
        createCustomer({name: 'Gordon'}),
        createCustomer({name: 'Roger'}),
        createCustomer({name: 'Bobby'}),
        createRestaurant({name: 'LeCirque'}),
        createRestaurant({name: 'MomoFuku'})
    ]);

    console.log(await fetchCustomers());
    console.log(await fetchRestaurants());

    const [reservation, reservation2] = await Promise.all([
        createReservation({
            customer_id: Gordon.id,
            restaurant_id: LeCirque.id,
            party_count: 5,
            date: '02/22/2024'
        }),
        createReservation({
            customer_id: Roger.id,
            restaurant_id: MomoFuku.id,
            party_count: 4,
            date: '04/24/2024'
        }),
    ]);

    console.log(await fetchReservations());

    await destroyReservation({ id: reservation.id, 
        customer_id: reservation.customer_id 
    });

    console.log(await fetchReservations());

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`listening on port ${port}`);
        console.log(`curl localhost:${port}/api/customers`);
        console.log(`curl localhost:${port}/api/restaurants`);
        console.log(`curl localhost:${port}/api/reservations`);
        console.log(`curl -X DELETE localhost:${port}/api/customers/${Roger.id}/reservations/${reservation2.id}`);
        console.log(`curl -X POST localhost:${port}/api/customers/${Bobby.id}/reservations/ -d '{"restaurant_is":${LeCirque.id}, "party_count": "3", "date": "03/22/2021"}' -H "Content-Type:application/json"`);
    })

}
init();