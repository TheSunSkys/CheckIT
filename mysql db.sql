CREATE TABLE teacher
( teacher_id varchar(10) NOT NULL,
  teacher_password varchar(12) NOT NULL,
  teacher_fname varchar(50) NOT NULL,
  teacher_lname varchar(50) NOT NULL,
  teacher_tel varchar(10) NOT NULL,
  teacher_email varchar(50) NOT NULL,
  teacher_photo varchar(500) ,
  CONSTRAINT teacher_pk PRIMARY KEY (teacher_id)
);

CREATE TABLE student
( student_id varchar(10) NOT NULL,
  student_password varchar(12) NOT NULL,
  student_fname varchar(50) NOT NULL,
  student_lname varchar(50) NOT NULL,
  student_tel integer(10) NOT NULL,
  student_email varchar(50) NOT NULL,
  student_photo varchar(500) ,
  CONSTRAINT student_pk PRIMARY KEY (student_id)
);

CREATE TABLE class_detail
( class_id varchar (10) NOT NULL,
  class_name varchar(100) NOT NULL,
  class_time varchar(100) NOT NULL,
  class_code varchar(5) NOT NULL,
  class_max_check integer(2) NOT NULL,
  teacher_id varchar(10) NOT NULL,
  CONSTRAINT class_detial_teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
  CONSTRAINT class_pk PRIMARY KEY (class_id)
);

CREATE TABLE class_round
( class_round_id integer(10) NOT NULL,
  class_date_check date NOT NULL,
  class_id varchar (10) NOT NULL,
  teacher_id varchar(10) NOT NULL,
  student_id varchar(10) NOT NULL,
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
  class_pos_lat integer(30) NOT NULL,
  class_pos_long integer(30) NOT NULL,
  student_photo varchar(500) NOT NULL,
  class_round_id integer (10) NOT NULL,
  teacher_id varchar(10) NOT NULL,
  student_id varchar(10) NOT NULL,
  CONSTRAINT class_teacher_fk FOREIGN KEY (teacher_id)
    REFERENCES teacher(teacher_id),
     CONSTRAINT class_student_fk FOREIGN KEY (student_id)
    REFERENCES student(student_id),
     CONSTRAINT class_class_round_fk FOREIGN KEY (class_round_id)
    REFERENCES class_round(class_round_id)
);
SELECT * FROM STUDENT WHERE student_id = 'B5972319' AND student_password = '25012541';
drop table class;
drop table class_round;
drop table class_detail;
drop table teacher;
drop table student;

insert into teacher values('999999','25012541','Ches','Ter','0999999999','itches25@gmail.com','999999');
insert into student (student_id,student_password,student_fname,student_lname,student_tel,student_email,student_photo) values('B5972319','25012541','it','ches','0933263450','itches25@gmail.com','b5972319');



delete from student where student_id = 'B1234567';
select * from student;
select * from class_detail;
INSERT INTO class_detial VALUES (204204,'CHESTER','Sunday 5:30 to 6:30 , Saturday 5:30 to 6:30','XXXXX',0,'999999');