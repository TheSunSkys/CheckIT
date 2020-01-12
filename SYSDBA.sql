CREATE TABLE teacher
( teacher_id number(10) NOT NULL,
  teacher_fname varchar2(50) NOT NULL,
  teacher_lname varchar2(50) NOT NULL,
  teacher_tel number(10) NOT NULL,
  teacher_email varchar2(50) NOT NULL,
  teacher_photo varchar2(500) NOT NULL,
  CONSTRAINT teacher_pk PRIMARY KEY (teacher_id)
);

CREATE TABLE student
( student_id number(10) NOT NULL,
  student_fname varchar2(50) NOT NULL,
  student_lname varchar2(50) NOT NULL,
  student_tel number(10) NOT NULL,
  student_email varchar2(50) NOT NULL,
  student_photo varchar2(500) NOT NULL,
  CONSTRAINT student_pk PRIMARY KEY (student_id)
);

CREATE TABLE class_detial
( class_id number (10) NOT NULL,
  class_name varchar2(100) NOT NULL,
  class_time TIMESTAMP NOT NULL,
  class_code varchar2(5) NOT NULL,
  class_max_check number(2) NOT NULL,
  teacher_id number(10) NOT NULL,
  CONSTRAINT teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
  CONSTRAINT class_id PRIMARY KEY (class_id)
);

drop table class_detial;
drop table teacher;
drop table student;

CREATE USER itches IDENTIFIED BY "2525" ACCOUNT UNLOCK;

grant create session to itches;
GRANT UNLIMITED TABLESPACE TO itches;