from selenium.webdriver.common.alert import Alert  # Import Alert handling

class TestTestCase1():
  def setup_method(self, method):
    self.driver = webdriver.Chrome()
    self.vars = {}
  
  def teardown_method(self, method):
    self.driver.quit()
  
  def test_testCase1(self):
    self.driver.get("http://localhost:3000/")
    self.driver.set_window_size(983, 844)
    
    # Login
    self.driver.find_element(By.NAME, "username").click()
    self.driver.find_element(By.NAME, "username").send_keys("testuser1")
    self.driver.find_element(By.NAME, "password").send_keys("Test@123")
    self.driver.find_element(By.CSS_SELECTOR, "button").click()

    # Creating a Group
    self.driver.find_element(By.CSS_SELECTOR, "input").click()
    self.driver.find_element(By.CSS_SELECTOR, "input").send_keys("monthly")
    self.driver.find_element(By.CSS_SELECTOR, "button:nth-child(2)").click()

    # ✅ Handle alert after creating group
    WebDriverWait(self.driver, 5).until(expected_conditions.alert_is_present())
    alert = self.driver.switch_to.alert
    print("Alert text:", alert.text)  # Print alert text (Optional for debugging)
    alert.accept()  # Click "OK"

    # Selecting Group
    self.driver.find_element(By.LINK_TEXT, "monthly").click()
    
    # Adding a Member
    self.driver.find_element(By.ID, "available-members").click()
    dropdown = self.driver.find_element(By.ID, "available-members")
    dropdown.find_element(By.XPATH, "//option[. = 'supmeet']").click()
    self.driver.find_element(By.CSS_SELECTOR, "button:nth-child(3)").click()

    # ✅ Handle alert after adding a member
    WebDriverWait(self.driver, 5).until(expected_conditions.alert_is_present())
    alert = self.driver.switch_to.alert
    print("Alert text:", alert.text)
    alert.accept()

    # Adding an Expense
    self.driver.find_element(By.LINK_TEXT, "Add Expense").click()
    self.driver.find_element(By.ID, "amount").click()
    self.driver.find_element(By.ID, "amount").send_keys("1100")
    self.driver.find_element(By.ID, "category").click()
    dropdown = self.driver.find_element(By.ID, "category")
    dropdown.find_element(By.XPATH, "//option[. = 'Travel']").click()
    self.driver.find_element(By.CSS_SELECTOR, "button").click()

    # ✅ Handle alert after adding expense
    WebDriverWait(self.driver, 5).until(expected_conditions.alert_is_present())
    alert = self.driver.switch_to.alert
    print("Alert text:", alert.text)
    alert.accept()

    # Navigating back to Home
    self.driver.find_element(By.ID, "home-button").click()

    # Marking Expense as Completed
    self.driver.find_element(By.CSS_SELECTOR, "button:nth-child(10)").click()
    self.driver.find_element(By.XPATH, "//button[contains(.,'Mark as Completed')]").click()
    
    # ✅ Handle alert after marking expense as completed (if applicable)
    WebDriverWait(self.driver, 5).until(expected_conditions.alert_is_present())
    alert = self.driver.switch_to.alert
    print("Alert text:", alert.text)
    alert.accept()

    print("✅ Test completed successfully!")
