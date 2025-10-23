import { Request, Response } from 'express';
import { } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../config/logger';



// Define AP subjects with their categories
const SUBJECTS = [
  {
    id: 'ap_physics_1_2',
    name: 'AP Physics 1 & 2 (algebra-based)',
    categories: [
      'Kinematics',
      'Dynamics',
      'Energy',
      'Momentum',
      'Rotational Motion',
      'Gravitation',
      'Fluids',
      'Thermodynamics',
      'Electric Circuits',
      'Waves and Sound',
      'Optics',
      'Modern Physics'
    ]
  },
  {
    id: 'ap_physics_c_mechanics',
    name: 'AP Physics C: Mechanics',
    categories: [
      'Kinematics',
      'Newton\'s Laws',
      'Work, Energy, Power',
      'Linear Momentum',
      'Rotational Motion',
      'Gravitation',
      'Oscillations',
      'Fluid Mechanics'
    ]
  },
  {
    id: 'ap_physics_c_electricity_magnetism',
    name: 'AP Physics C: Electricity & Magnetism',
    categories: [
      'Electrostatics',
      'Electric Circuits',
      'Magnetic Fields',
      'Electromagnetism',
      'Electromagnetic Induction',
      'AC Circuits',
      'Maxwell\'s Equations',
      'Electromagnetic Waves'
    ]
  },
  {
    id: 'ap_chemistry',
    name: 'AP Chemistry',
    categories: [
      'Atomic Structure',
      'Molecular Structure',
      'Intermolecular Forces',
      'Chemical Reactions',
      'Kinetics',
      'Thermodynamics',
      'Equilibrium',
      'Acids and Bases',
      'Electrochemistry',
      'Organic Chemistry',
      'Nuclear Chemistry'
    ]
  },
  {
    id: 'ap_biology',
    name: 'AP Biology',
    categories: [
      'Chemistry of Life',
      'Cell Structure and Function',
      'Cellular Energetics',
      'Cell Communication',
      'Heredity',
      'Gene Expression',
      'Natural Selection',
      'Ecology'
    ]
  },
  {
    id: 'ap_computer_science_a',
    name: 'AP Computer Science A',
    categories: [
      'Primitive Types',
      'Using Objects',
      'Boolean Expressions',
      'Iteration',
      'Writing Classes',
      'Array',
      'ArrayList',
      '2D Arrays',
      'Inheritance',
      'Recursion'
    ]
  },
  {
    id: 'ap_computer_science_principles',
    name: 'AP Computer Science Principles',
    categories: [
      'Creative Development',
      'Data',
      'Algorithms and Programming',
      'Computer Systems',
      'Impact of Computing'
    ]
  },
  {
    id: 'ap_precalculus',
    name: 'AP Pre-calculus',
    categories: [
      'Functions',
      'Polynomial and Rational Functions',
      'Exponential and Logarithmic Functions',
      'Trigonometric Functions',
      'Matrices',
      'Conic Sections',
      'Vectors',
      'Probability and Statistics'
    ]
  },
  {
    id: 'ap_calculus_bc',
    name: 'AP Calculus BC',
    categories: [
      'Limits and Continuity',
      'Differentiation',
      'Applications of Differentiation',
      'Integration',
      'Applications of Integration',
      'Differential Equations',
      'Parametric, Polar, and Vector Functions',
      'Infinite Sequences and Series'
    ]
  },
  {
    id: 'ap_calculus_ab',
    name: 'AP Calculus AB',
    categories: [
      'Limits and Continuity',
      'Differentiation',
      'Applications of Differentiation',
      'Integration',
      'Applications of Integration',
      'Differential Equations'
    ]
  },
  {
    id: 'ap_statistics',
    name: 'AP Statistics',
    categories: [
      'Exploring One-Variable Data',
      'Exploring Two-Variable Data',
      'Collecting Data',
      'Probability',
      'Random Variables',
      'Sampling Distributions',
      'Confidence Intervals',
      'Significance Tests',
      'Comparing Two Populations',
      'Chi-Square Tests',
      'Linear Regression'
    ]
  }
];

/**
 * GET /api/subjects
 * Get all available subjects with their categories
 */
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching all subjects');

    res.json({
      success: true,
      data: SUBJECTS
    });
  } catch (error) {
    logger.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects'
    });
  }
};

/**
 * GET /api/subjects/:id
 * Get a specific subject by ID
 */
export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const subject = SUBJECTS.find(s => s.id === id);

    if (!subject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
      return;
    }

    logger.info(`Fetching subject: ${id}`);

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    logger.error('Error fetching subject:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject'
    });
  }
};
