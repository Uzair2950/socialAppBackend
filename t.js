let _slotModel = {
  courseCode: "",
  courseTitle: "",
  instructor: "",
  venue: "",
  start_time: "",
  end_time: "",
};

let x = {
  section: "7C", // ObjectId // Section _ID Instead => Then Poupate
  slots: {
    monday: [
      {
        course: "ENG-401 TBW",
        instructor: "Ihsan",
        venue: "Lab 11",
        start_time: "8:30",
        start_time: "9:30",
      },
      {
        course: "CSC-312 CC",
        instructor: "Dr. Naseer",
        venue: "Lt2",
        start_time: "2:00",
        start_time: "3:00",
      },
      {
        course: "CSC-312 CC",
        instructor: "Dr. Naseer",
        venue: "Lab 7",
        start_time: "4:00",
        start_time: "5:00",
      },
      {
        course: "CS-693 MAP",
        instructor: "Jaweria",
        venue: "Lab 9",
        start_time: "5:00",
        start_time: "6:00",
      },
    ],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  },
};

console.log(x);
