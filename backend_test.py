import requests
import sys
import json
from datetime import datetime

class LexiSenseAPITester:
    def __init__(self, base_url="https://stack-deploy-6.preview.emergentagent.com"):
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

    def run_api_test(self, name, method, endpoint, expected_status, data=None, files=None):
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
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
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