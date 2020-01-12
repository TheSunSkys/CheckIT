CREATE TABLE teacher
( teacher_id varchar2(10) NOT NULL,
  teacher_fname varchar2(50) NOT NULL,
  teacher_lname varchar2(50) NOT NULL,
  teacher_tel varchar2(10) NOT NULL,
  teacher_email varchar2(50) NOT NULL,
  teacher_photo varchar2(500) ,
  CONSTRAINT teacher_pk PRIMARY KEY (teacher_id)
);

CREATE TABLE student
( student_id varchar2(10) NOT NULL,
  student_fname varchar2(50) NOT NULL,
  student_lname varchar2(50) NOT NULL,
  student_tel varchar2(10) NOT NULL,
  student_email varchar2(50) NOT NULL,
  student_photo varchar2(500) ,
  CONSTRAINT student_pk PRIMARY KEY (student_id)
);

CREATE TABLE class_detail
( class_id varchar2 (10) NOT NULL,
  class_name varchar2(100) NOT NULL,
  class_time varchar2(100) NOT NULL,
  class_code varchar2(5) NOT NULL,
  class_max_check number(2) NOT NULL,
  teacher_id varchar2(10) NOT NULL,
  CONSTRAINT class_detial_teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
  CONSTRAINT class_pk PRIMARY KEY (class_id)
);

CREATE TABLE class_round
( class_round_id number(10) NOT NULL,
  class_date_check date NOT NULL,
  class_id varchar2 (10) NOT NULL,
  teacher_id varchar2(10) NOT NULL,
  student_id varchar2(10) NOT NULL,
  CONSTRAINT class_round_teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
     CONSTRAINT class_round_student_fk FOREIGN KEY (student_id)
    REFERENCES student(student_id),
     CONSTRAINT class_round_class_fk FOREIGN KEY (class_id)
    REFERENCES class_detail(class_id),
  CONSTRAINT class_round_pk PRIMARY KEY (class_round_id)
);


CREATE TABLE class
( class_time_check TIMESTAMP NOT NULL,
  class_pos_lat number(30) NOT NULL,
  class_pos_long number(30) NOT NULL,
  student_photo varchar2(500) NOT NULL,
  class_round_id number (10) NOT NULL,
  teacher_id varchar2(10) NOT NULL,
  student_id varchar2(10) NOT NULL,
  CONSTRAINT class_teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
     CONSTRAINT class_student_fk FOREIGN KEY (student_id)
    REFERENCES student(student_id),
     CONSTRAINT class_class_round_fk FOREIGN KEY (class_round_id)
    REFERENCES class_round(class_round_id)
);

drop table class;
drop table class_round;
drop table class_detail;
drop table teacher;
drop table student;

insert into student (student_id,student_fname,student_lname,student_tel,student_email,student_photo) values('B5972319','it','ches','0933263450','itches25@gmail.com','b5972319');

CREATE USER itches IDENTIFIED BY "2525" ACCOUNT UNLOCK;

grant create session to itches;
GRANT UNLIMITED TABLESPACE TO itches;

select * from student;