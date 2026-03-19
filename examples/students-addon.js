import {
  createBlueFissionApp,
  createCrudPanelModule,
  createJQueryBridge,
  createRecordModel
} from "../src/index.js";

const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    student: {
      endpoint: "students",
      actions: {
        recentAtRisk: {
          path: "recent_at_risk",
          method: "GET"
        },
        atRisk: {
          path: "at_risk",
          method: "GET"
        },
        excelling: {
          path: "excelling",
          method: "GET"
        },
        generate: "generate"
      }
    },
    studentSettings: "student_settings"
  }
});

const bridge = createJQueryBridge(window.jQuery);

const student = createRecordModel({
  student_id: 0,
  uid: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  email: "",
  gpa: 0,
  class_level: "",
  notes: "",
  status: 0
});

const age = app.computed(() => {
  const value = student.date_of_birth?.value;
  return value ? new Date().getFullYear() - new Date(value).getFullYear() : "";
}, [student.date_of_birth].filter(Boolean));

const students = app.recordSet([], {
  idKey: "student_id",
  fetcher: async () => {
    const response = await app.resources.student.list();
    return {
      list: response.list,
      total: response.list.length
    };
  }
});

app.assign("student_id", student.student_id);
app.assign("first_name", student.first_name);
app.assign("last_name", student.last_name);
app.assign("email", student.email);
app.assign("gpa", student.gpa);
app.assign("class_level", student.class_level);
app.assign("age", age);

app.set(".student-id-field", student.student_id, "value", {
  rejectOn: Number.isNaN,
  mutator: Number
});
app.set(".student-email-field", student.email, "value");
app.set(".student-status-field", student.status, "value");

const dashboardPanel = createCrudPanelModule({
  name: "students-dashboard",
  resource: app.resources.student,
  model: student,
  bridge,
  ui: {
    notice(message, type) {
      console.log(type || "success", message);
    }
  },
  screens: {
    list: "#student-listing-screen",
    edit: "#student-edit-screen"
  },
  selectors: {
    homeButton: ".home-btn",
    addButton: "#student-add-btn",
    saveButton: "#student-save-btn",
    deleteButton: "#student-delete-btn",
    showButton: ".show-btn",
    editButton: ".edit-btn",
    manageButton: ".settings-btn"
  },
  list: {
    root: "#dataTable",
    selector: "#dataTable",
    reload() {
      bridge.dataTableReload("#dataTable");
    },
    getRecord(trigger) {
      return window.studentTable.row(window.jQuery(trigger).parents("tr")).data();
    }
  },
  hooks: {
    async onStart() {
      await students.fetch();
    },
    async afterRead({ model }) {
      const template = app.template("#student-detail-display-item", model);
      template.render();
      template.swap("#student-details");
    },
    async manage({ row }) {
      const response = await app.resources.studentSettings.read(row.student_id);
      console.log("settings", response.data);
    }
  },
  messages: {
    saved: "Student has been saved.",
    deleted: "Student has been deleted."
  }
});

app.panels.register("dashboard", dashboardPanel);
app.activatePanel("dashboard");

window.studentsApp = app;
