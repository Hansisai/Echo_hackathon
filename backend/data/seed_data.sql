-- Baseline City Profiles
-- ----------------------------------------------------
-- 1. Metropolis Prime (Dense Transit Metropolis)
-- 2. Automopolis (Sprawling Highway Metropolis)
-- 3. Industria (Factory & Manufacturing Hub)
-- 4. Equitopia (Eco-Progressive Town)

-- Note: The FastAPI backend automatically runs these seeds into SQLAlchemy on startup if tables are empty.

-- CITIES
INSERT INTO cities (id, name, population, transit_share, avg_commute_dist, co2_baseline, aqi_baseline, median_income, health_index, municipal_budget, satisfaction_baseline) 
VALUES 
(1, 'Metropolis Prime', 8500000, 55.0, 12.5, 4.2, 65, 62000.0, 78.0, 4500.0, 72.0),
(2, 'Automopolis', 3200000, 10.0, 24.0, 11.8, 135, 58000.0, 55.0, 1800.0, 50.0),
(3, 'Industria', 4800000, 25.0, 15.0, 14.5, 165, 42000.0, 48.0, 2200.0, 45.0),
(4, 'Equitopia', 1200000, 35.0, 6.2, 2.1, 38, 68000.0, 88.0, 950.0, 85.0);

-- POLICIES
INSERT INTO policies (id, name, description, min_value, max_value, default_value, unit) 
VALUES 
('congestion_pricing', 'Congestion Pricing Zone', 'Imposes a fee for driving private vehicles inside the downtown core during peak traffic hours to reduce gridlock.', 0.0, 25.0, 8.0, '$'),
('metro_fare_subsidy', 'Metro Fare Subsidy & Expansion', 'Subsidizes transit fares and allocates capital to building new subway tracks to support shifting away from cars.', 0.0, 100.0, 30.0, '%'),
('carbon_tax', 'Carbon Tax & Green Transition', 'Levies a tax on corporate carbon emissions and routes the revenues to subsidizing residential solar installation.', 0.0, 150.0, 40.0, '$/ton'),
('wfh_mandate', 'Work From Home Incentives', 'Offers corporate tax incentives to companies that implement WFH to lower peak gridlock.', 0.0, 5.0, 2.0, 'days/week'),
('green_canopy', 'Urban Green Canopy Expansion', 'Funds neighborhood tree-planting campaigns and park development to reduce urban heat islands.', 0.0, 50.0, 15.0, '%');
