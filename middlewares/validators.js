import {body} from 'express-validator';

export const validateRegistration = [
    body('firstName', 'First name is required').not().isEmpty().trim().escape(),
    body('lastName', 'Last name is required').not().isEmpty().trim().escape(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').not().isEmpty(),
];

export const validateLogin = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists(),
];

