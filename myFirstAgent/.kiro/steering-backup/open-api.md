---
inclusion: manual
---
# Generic Javadoc Rules for REST Controller OpenAPI Documentation

**Target:** Java REST Controller classes (e.g., annotated with `@RestController`) within `mdm-app`, `wes-app`, and `wms-app` modules, excluding those covered by Exclusions.

**Purpose:** Ensure consistent and informative Javadoc comments suitable for generating OpenAPI documentation, following project-specific conventions.

**Scope Limitation:**
*   **Javadoc Only:** These rules apply *exclusively* to the content and structure of Javadoc comments (`/** ... */`).
*   **No Code/URL Changes:** Do **not** modify Java code logic, method signatures, parameter types/names, return types, or endpoint URL paths defined in annotations (e.g., `@RequestMapping`, `@GetMapping`, `@PostMapping`) as part of applying these documentation guidelines.
*   **Ignore Tagged Classes:** If a controller class already has the `@ignore` tag in its Javadoc comment, the file can be skipped and does not require additional Javadoc modifications. The presence of this tag alone is sufficient to exclude the controller from API documentation.

**Important Note on URL Prefixes (mdm, wes, wms):**
*   This rule file defines conventions for Javadoc *comments*. It **cannot** enforce URL path prefixes (like `/mdm/`, `/wes/`, `/wms/`) in the generated OpenAPI specification if they are not present in the controller's `@RequestMapping` annotation.
*   Achieving URL prefixes without modifying `@RequestMapping` typically requires advanced configuration of your OpenAPI generation tool (e.g., Springdoc, Swagger) or other mechanisms beyond the scope of Javadoc rules.

**Exclusions and @ignore Usage:**
*   **WCS App:** Controllers or endpoints located within paths containing `wcs-app` are generally excluded from the OpenAPI documentation generation process by convention or tooling and typically do **not** require `@ignore` tags.
*   **WMS BAM:** Controllers or endpoints located within paths containing `wms-bam` **should** be explicitly marked with the `@ignore` Javadoc tag on the relevant class or methods to exclude them from OpenAPI documentation.
*   **Other Cases:** The `@ignore` tag **should** also be explicitly added for any other internal, deprecated, or non-public endpoints that need exclusion.
*   **Clarity:** Do **not** automatically add `@ignore` tags based on path conventions alone without explicit instruction or confirmation if there is ambiguity. The intent to exclude should be clear.

**Rules:**

1.  **Class-Level Javadoc:**
    *   **First Line (Business Name & Level):**
        *   For controllers **not** within `wms-bam` or `wcs-app` paths: **Must** use the exact format `[First Level Category]/[Business Name]/Level 1`. For example: `Master Data/Customer Management/Level 1`. Ensure the literal `/Level 1` is appended.
        *   For controllers within `wms-bam` (which should be marked `@ignore`): Specific naming is less critical, but use `[First Level Category]/[Business Name]` if documented internally. The `/Level 1` suffix is not required for ignored controllers.
        *   **Do not** include the word "Controller" in this line.
        *   **First Level Categories** must be one of the following standard categories:
            *   `Master Data` - For all MDM related controllers
            *   `Inventory Management` - For inventory and LP related controllers
            *   `Inbound Management` - For receipt and inbound related controllers
            *   `Outbound Management` - For order, outbound, load, small parcel related controllers
            *   `Task` - For all types of task controllers
            *   `Report` - For report related controllers
            *   `RMS` - For RMS related controllers
            *   `Entry Management` - For entry, dock, appointment related controllers
            *   `Configuration` - For settings and configuration related controllers
            *   `Document` - For document related controllers
            *   `Facility Management` - For facility and warehouse related controllers
    *   **Second Line (Description):**
        *   Provide a brief description summarizing the controller's responsibility (e.g., `Manages operations related to user profiles.`, `Handles searching and retrieval of product information.`).
    *   **`@module` Tag:**
        *   Add the `@module` tag immediately after the Description line, with the value corresponding to the directory:
            *   `@module wms` for controllers in `wms-app` directory
            *   `@module mdm` for controllers in `mdm-app` directory
            *   `@module wes` for controllers in `wes-app` directory
            *   `@module wcs` for controllers in `wcs-app` directory
    *   **`@ignore` Tag (Simplification):**
        *   For classes that should be excluded from API documentation, a simple `@ignore` tag is sufficient.
        *   When using only the `@ignore` tag without additional details, no other Javadoc elements (business name, description, etc.) are required.

2.  **Method-Level Javadoc (for public API endpoints):**
    *   **First Line (Summary):**
        *   Clearly state the specific business action the endpoint performs.
        *   Use a consistent naming convention, typically `Verb + Noun/Concept` (e.g., `Create User Profile`, `Search Product Catalog`, `Get Order Details`, `Update Order Status`).
        *   **Do not** add module prefixes (`mdm:`, `wes:`, `wms:`) here; they do not affect the generated URL.
    *   **Second Line (Description):**
        *   Add a concise description explaining the method's purpose or action in more detail (e.g., `Creates a new user profile based on the provided details.`, `Retrieves a list of products matching the search criteria.`, `Updates the status of an existing order.`).
    *   **`@param` Tags:**
        *   Include a `@param` tag for each method parameter.
        *   Provide a clear description of the parameter's purpose (e.g., `@param userId The unique identifier of the user.`, `@param searchCriteria Object containing filtering and sorting options.`).
    *   **`@return` Tag:**
        *   Describe the returned value or response object.
        *   For methods using a standard response wrapper (like the `R` class in your project), indicate this and what it contains (e.g., `@return R containing the created UserProfileDto.`, `@return R indicating success or failure.`). Adapt `R` and DTO names as per your project's convention.
    *   **`@ignore` Tag:**
        *   Apply this tag explicitly to methods or classes that **should be excluded** from OpenAPI documentation, particularly those within `wms-bam` paths or designated as internal/deprecated.
        *   Optionally, add a comment explaining the reason (e.g., `* @ignore Belongs to wms-bam path.`, `* @ignore Internal use only.`).

**Example Structure (Non-BAM/WCS Controller):**

```java
/**
 * Master Data/Customer Management/Level 1 // First Level Category/Business Name WITH '/Level 1'
 * Manages operations related to customer data. // Description
 * @module mdm
 */
@RestController
@RequestMapping("/customers") // URL prefix (mdm, wes, wms) needs to be handled here or via tool config
public class CustomerController { // Class name might vary

    /**
     * Get Customer Details // Method Summary (NO module prefix)
     * Retrieves details for a specific customer by its ID. // Description
     * @param customerId The unique identifier of the customer. // @param
     * @return R containing the requested CustomerDto. // @return (adapt R and Dto)
     */
    @GetMapping("/{customerId}")
    public R<CustomerDto> getCustomerDetails(@PathVariable String customerId) {
        // ... implementation ...
    }

    // ... other methods ...
}
```

**Example (Simplified Ignore Controller):**

```java
/**
 * @ignore
 */
@RestController
@RequestMapping("/internal/utilities")
public class InternalUtilityController {
    // Methods don't require further documentation as the entire class is ignored
}
```

**Example (WMS-BAM Controller - To be Ignored):**

```java
/**
 * Task/Internal Batch Processing // First Level Category/Business Name (Level 1 not needed for ignored)
 * Handles internal background tasks for WMS BAM.
 * @module wms
 * @ignore Belongs to wms-bam path, excluded from public API. // Explicit @ignore
 */
@RestController
@RequestMapping("/wms-bam/internal/batch") // Path indicates BAM
public class BamBatchController {

    /**
     * Trigger Batch Job
     * Starts the internal batch processing job.
     * @ignore Method within an ignored class. // Explicit @ignore
     * @param params Batch parameters.
     * @return R indicating job start status.
     */
    @PostMapping("/start")
    public R<Void> startBatch(@RequestBody BatchParams params) {
        // ... implementation ...
    }
}
```

**Important Note:** Remember the linter errors we encountered in your specific project regarding `com.item.xms.web.model.R` and `com.item.xms.persistence.query.PageResult`. These rules assume such classes are correctly imported and available. You still need to resolve those specific import issues in your codebase for the Javadoc `@return` tags referencing them to be fully accurate and for the code to compile.