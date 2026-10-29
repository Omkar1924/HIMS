package com.hims.backend.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.hims.backend.entity.DischargeTemplate;
import com.hims.backend.repository.DischargeTemplateRepository;

/**
 * Creates the default discharge template once, when the table is empty.
 *
 * Section shape used by the React section editor:
 * { id, heading, layout: "normal" | "bold", filledBy: "NURSE" | "DOCTOR",
 *   fields: [ { key, question, helperText, inputType: "TEXT" | "YES_NO_TEXT",
 *               narrative: "sentence with {{answer}}", narrativeNo: "text when answer is No",
 *               value: "", yes: null } ] }
 */
@Component
public class DischargeTemplateSeeder implements CommandLineRunner {

    private static final String HELPER =
            "Mention only information recorded in the patient's file. "
                    + "If unknown or not documented, leave it for review rather than guessing.";

    private static final String SECTIONS = """
            [
              {"id":"s1","heading":"Reason for Admission","layout":"normal","filledBy":"NURSE","fields":[
                {"key":"reason","question":"Why was the patient admitted to the hospital? What symptoms or problem were recorded?","helperText":"%1$s","inputType":"TEXT","narrative":"The patient was admitted with {{answer}}.","value":"","yes":null},
                {"key":"initial","question":"What was the patient's condition when admitted?","helperText":"%1$s","inputType":"TEXT","narrative":"On admission, the patient's condition was {{answer}}.","value":"","yes":null}
              ]},
              {"id":"s2","heading":"Treatment and Procedures","layout":"normal","filledBy":"NURSE","fields":[
                {"key":"treatment","question":"What treatment, medicines, or supportive care were given during the hospital stay?","helperText":"%1$s","inputType":"TEXT","narrative":"During hospitalization, the patient received {{answer}}.","value":"","yes":null},
                {"key":"procedures","question":"Was any surgery, procedure, or special intervention performed? If yes, provide details.","helperText":"%1$s","inputType":"YES_NO_TEXT","narrative":"The following procedures were performed: {{answer}}.","narrativeNo":"","value":"","yes":null}
              ]},
              {"id":"s3","heading":"Investigations","layout":"normal","filledBy":"NURSE","fields":[
                {"key":"investigations","question":"Which important tests or investigations were performed, and what were the significant findings?","helperText":"%1$s","inputType":"TEXT","narrative":"Relevant investigations included {{answer}}.","value":"","yes":null}
              ]},
              {"id":"s4","heading":"Clinical Progress","layout":"normal","filledBy":"NURSE","fields":[
                {"key":"progress","question":"How did the patient's condition change during hospitalization?","helperText":"%1$s","inputType":"TEXT","narrative":"During the hospital stay, the patient's condition {{answer}}.","value":"","yes":null}
              ]},
              {"id":"s5","heading":"Complications","layout":"normal","filledBy":"NURSE","fields":[
                {"key":"complications","question":"Did any complications occur during the stay?","helperText":"%1$s","inputType":"YES_NO_TEXT","narrative":"The following complications were documented: {{answer}}.","narrativeNo":"No complications documented.","value":"","yes":null}
              ]},
              {"id":"s6","heading":"Condition at Discharge","layout":"normal","filledBy":"DOCTOR","fields":[
                {"key":"discharge","question":"What was the patient's documented condition when discharged?","helperText":"Doctor-verified.","inputType":"TEXT","narrative":"At discharge, the patient's condition was recorded as {{answer}}.","value":"","yes":null}
              ]}
            ]
            """;

    private final DischargeTemplateRepository repo;

    public DischargeTemplateSeeder(DischargeTemplateRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) {
            return;
        }

        DischargeTemplate t = new DischargeTemplate();
        t.setName("Patient Discharge Summary");
        t.setTemplateCode("DS-001");
        t.setDocumentTitle("PATIENT DISCHARGE SUMMARY");
        t.setCentreName("HOSPITAL NAME");
        t.setCentreAddress("Hospital address");
        t.setCentrePhone("Contact details");
        t.setSectionsJson(SECTIONS.formatted(HELPER));
        t.setLayoutJson("{}");
        repo.save(t);
    }
}