CREATE TABLE "user"
(
   id SERIAL PRIMARY KEY,
   first_name VARCHAR(100) NOT NULL,
   last_name VARCHAR(100) NOT NULL,
   password VARCHAR(255) NOT NULL,
   username VARCHAR(100) UNIQUE NOT NULL,
   email VARCHAR(100) UNIQUE NOT NULL,
   bells INT DEFAULT(100),
   gift_date date
);

CREATE TABLE item
(
   id SERIAL PRIMARY KEY,
   item_name VARCHAR(100) UNIQUE NOT NULL,
   buy_price INT,
   sell_price INT,
   set VARCHAR(50),
   img_url VARCHAR(1000) NOT NULL
);

CREATE TABLE inventory
(
   id SERIAL PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   owner_id INT NOT NULL REFERENCES "user"(id),
   count INT default(1)
);

CREATE TABLE item_set
(
   id SERIES PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   set_id INT NOT NULL REFERENCES set(id)
);

INSERT INTO item_set (item_id, set_id) VALUES(0, 0);

/*CREATE TABLE item_series
(
   id SERIES PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   series_id INT NOT NULL REFERENCES series(id)
);*/

CREATE TABLE item_interior_theme
(
   id SERIES PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   interior_theme_id INT NOT NULL REFERENCES interior_theme(id)
);

INSERT INTO item_interior_theme (item_id, interior_theme_id) VALUES(0, 0);

CREATE TABLE item_fashion_theme
(
   id SERIES PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   fashion_theme_id INT NOT NULL REFERENCES fashion_theme(id)
);

INSERT INTO fashion_interior_theme (item_id, fashion_theme_id) VALUES(0, 0);

CREATE TABLE item_type
(
   id SERIES PRIMARY KEY,
   item_id INT NOT NULL REFERENCES item(id),
   type_id INT NOT NULL REFERENCES type(id)
);

INSERT INTO item_type (item_id, type_id) VALUES(0, 0);

CREATE TABLE set
(
   id SERIAL PRIMARY KEY,
   name VARCHAR(100) NOT NULL
);

/*CREATE TABLE series
(
   id SERIAL PRIMARY KEY,
   name VARCHAR(100) NOT NULL
);*/

CREATE TABLE interior_theme
(
   id SERIAL PRIMARY KEY,
   name VARCHAR(100) NOT NULL
);

CREATE TABLE fashion_theme
(
   id SERIAL PRIMARY KEY,
   name VARCHAR(100) NOT NULL
);

