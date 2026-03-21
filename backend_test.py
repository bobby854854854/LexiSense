import requests
import sys
import json
from datetime import datetime

class LexiSenseAPITester:
    def __init__(self, base_url="https://docflow-analyzer.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.organization_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_api_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                if params:
                    response = requests.put(url, headers=headers, params=params)
                else:
                    response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                if params:
                    response = requests.patch(url, headers=headers, params=params)
                elif files or isinstance(data, dict) and any(isinstance(v, (list, str)) for v in data.values()):
                    # Form data for PATCH
                    headers.pop('Content-Type', None)
                    response = requests.patch(url, data=data, headers=headers)
                else:
                    response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_api_test("Health Check", "GET", "health", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_email = f"test_user_{timestamp}@lexisense.com"
        self.test_password = "TestPass123!"
        
        test_data = {
            "email": self.test_email,
            "password": self.test_password,
            "firstName": "Test",
            "lastName": "User",
            "organizationName": f"Test Org {timestamp}"
        }
        
        response = self.run_api_test("User Registration", "POST", "auth/register", 200, test_data)
        if response:
            self.token = response.get('access_token')
            if response.get('user'):
                self.user_id = response['user'].get('id')
                self.organization_id = response['user'].get('organizationId')
            return True
        return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = self.run_api_test("User Login", "POST", "auth/login", 200, login_data)
        if response:
            self.token = response.get('access_token')
            if response.get('user'):
                self.user_id = response['user'].get('id')
                self.organization_id = response['user'].get('organizationId')
            return True
        return False

    def test_get_current_user(self):
        """Test get current user info"""
        return self.run_api_test("Get Current User", "GET", "auth/me", 200) is not None

    def test_dashboard_stats(self):
        """Test dashboard stats API"""
        return self.run_api_test("Dashboard Stats", "GET", "dashboard/stats", 200) is not None

    def test_dashboard_activity(self):
        """Test dashboard activity API"""
        return self.run_api_test("Dashboard Activity", "GET", "dashboard/activity", 200) is not None

    def test_contracts_list(self):
        """Test contracts list API"""
        return self.run_api_test("Contracts List", "GET", "contracts", 200) is not None

    def test_team_members_list(self):
        """Test team members list API"""
        return self.run_api_test("Team Members List", "GET", "team/members", 200) is not None

    def test_team_invitations_list(self):
        """Test team invitations list API"""
        return self.run_api_test("Team Invitations List", "GET", "team/invitations", 200) is not None

    def test_logout(self):
        """Test logout endpoint"""
        return self.run_api_test("User Logout", "POST", "auth/logout", 200) is not None

    # NEW FEATURES TESTING
    def test_team_invite_email(self):
        """Test team invitation with email sending - POST /api/team/invite"""
        invite_data = {
            "email": f"invited_user_{datetime.now().strftime('%H%M%S')}@example.com",
            "role": "user"
        }
        response = self.run_api_test("Team Invite Email", "POST", "team/invite", 200, invite_data)
        return response is not None

    def test_alert_settings_get(self):
        """Test get alert settings - GET /api/alerts/settings"""
        return self.run_api_test("Get Alert Settings", "GET", "alerts/settings", 200) is not None

    def test_alert_settings_update(self):
        """Test update alert settings - PUT /api/alerts/settings"""
        params = {
            "alertDays": [30, 14, 7, 1],
            "emailEnabled": True
        }
        return self.run_api_test("Update Alert Settings", "PUT", "alerts/settings", 200, params=params) is not None

    def test_expiring_contracts(self):
        """Test get expiring contracts - GET /api/alerts/expiring"""
        return self.run_api_test("Get Expiring Contracts", "GET", "alerts/expiring?days=30", 200) is not None

    def test_alert_history(self):
        """Test get alert history - GET /api/alerts/history"""
        return self.run_api_test("Get Alert History", "GET", "alerts/history", 200) is not None

    def test_contract_upload_and_versions(self):
        """Test contract upload and version creation"""
        # First upload a contract
        test_content = "This is a test contract content for version testing."
        files = {'file': ('test_contract.txt', test_content, 'text/plain')}
        form_data = {
            'title': 'Test Contract for Versions',
            'counterparty': 'Test Company',
            'contractType': 'Service Agreement'
        }
        
        response = self.run_api_test("Contract Upload", "POST", "contracts", 200, form_data, files)
        if response and response.get('id'):
            contract_id = response['id']
            
            # Test getting contract versions
            versions_response = self.run_api_test("Get Contract Versions", "GET", f"contracts/{contract_id}/versions", 200)
            
            # Test updating contract (should create version)
            update_params = {
                "title": "Updated Test Contract",
                "changeReason": "Testing version creation"
            }
            update_response = self.run_api_test("Update Contract (Create Version)", "PATCH", f"contracts/{contract_id}", 200, params=update_params)
            
            # Test getting versions again (should have new version)
            versions_after_update = self.run_api_test("Get Contract Versions After Update", "GET", f"contracts/{contract_id}/versions", 200)
            
            return all([versions_response is not None, update_response is not None, versions_after_update is not None])
        
        return False

    def test_check_and_send_alerts(self):
        """Test manual alert check and send"""
        return self.run_api_test("Check and Send Alerts", "POST", "alerts/check-and-send", 200) is not None

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting LexiSense Backend API Tests")
        print("=" * 50)
        
        # Test health check first
        self.test_health_check()
        
        # Test user registration and authentication flow
        if self.test_user_registration():
            # Test authenticated endpoints
            self.test_get_current_user()
            self.test_dashboard_stats()
            self.test_dashboard_activity()
            self.test_contracts_list()
            self.test_team_members_list()
            self.test_team_invitations_list()
            
            # NEW FEATURES TESTING
            print("\n🔥 Testing New Features:")
            print("-" * 30)
            self.test_team_invite_email()
            self.test_alert_settings_get()
            self.test_alert_settings_update()
            self.test_expiring_contracts()
            self.test_alert_history()
            self.test_contract_upload_and_versions()
            self.test_check_and_send_alerts()
            
            self.test_logout()
            
            # Test login with registered credentials
            self.test_user_login()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = LexiSenseAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())