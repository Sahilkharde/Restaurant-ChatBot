const axios = require('axios');
const config = require(global.appRoot + '/config/config');

const axiosPostFn = async (url, data) => {
    try {
        const response = await axios.post(url, data, {
            headers: {
                "Content-Type": "application/json",
                "Origin": 'ChatbotBackend'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

module.exports = axiosPostFn;